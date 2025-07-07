import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TestAttempt, AttemptStatus, SubmissionType, ReviewStatus, ResultType } from '../tests/entities/test-attempt.entity';
import { TestUserAnswer, ReviewStatus as AnswerReviewStatus } from '../tests/entities/test-user-answer.entity';
import { Test, TestType, TestStatus, AttemptsGradeMethod } from '../tests/entities/test.entity';
import { TestQuestion } from '../tests/entities/test-question.entity';
import { TestRule } from '../tests/entities/test-rule.entity';
import { Question, QuestionType, GradingType } from '../questions/entities/question.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ReviewAttemptDto } from './dto/review-answer.dto';
import { PluginManagerService } from '@/common/services/plugin-manager.service';
import { QuestionPoolService } from '../tests/question-pool.service';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectRepository(TestAttempt)
    private readonly attemptRepository: Repository<TestAttempt>,
    @InjectRepository(TestUserAnswer)
    private readonly testUserAnswerRepository: Repository<TestUserAnswer>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(TestQuestion)
    private readonly testQuestionRepository: Repository<TestQuestion>,
    @InjectRepository(TestRule)
    private readonly testRuleRepository: Repository<TestRule>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly pluginManager: PluginManagerService,
    private readonly questionPoolService: QuestionPoolService,
  ) {}

  async startAttempt(testId: string, userId: string, authContext: AuthContext): Promise<TestAttempt> {
    // Check if test exists and user can attempt
    const test = await this.testRepository.findOne({
      where: {
        testId: testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Check if user has remaining attempts
    const existingAttempts = await this.attemptRepository.count({
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (existingAttempts >= test.attempts) {
      throw new Error('Maximum attempts reached for this test');
    }

    // Create attempt
    const attempt = this.attemptRepository.create({
      testId,
      userId,
      attempt: existingAttempts + 1,
      status: AttemptStatus.IN_PROGRESS,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    });

    const savedAttempt = await this.attemptRepository.save(attempt);

    // Generate questions based on test type
    if (test.type === TestType.RULE_BASED) {
      await this.generateRuleBasedTestQuestions(savedAttempt, test, authContext);
    }

    // Trigger plugin event
    await this.triggerPluginEvent(PluginManagerService.EVENTS.ATTEMPT_STARTED, authContext, {
      attemptId: savedAttempt.attemptId,
      testId: savedAttempt.testId,
      attemptNumber: savedAttempt.attempt,
    });

    return savedAttempt;
  }

  async getAttemptQuestions(attemptId: string, authContext: AuthContext): Promise<Question[]> {
    const attempt = await this.findAttemptById(attemptId, authContext);

    // Get questions from the resolved test (generated test for rule-based)
    const testId = attempt.resolvedTestId || attempt.testId;
    
    const testQuestions = await this.testQuestionRepository.find({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { ordering: 'ASC' },
    });

    const questionIds = testQuestions.map(tq => tq.questionId);
    
    if (questionIds.length === 0) {
      return [];
    }
    
    return this.questionRepository.find({
      where: {
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });
  }

  async submitAnswer(attemptId: string, submitAnswerDto: SubmitAnswerDto, authContext: AuthContext): Promise<void> {
    // Verify attempt exists and belongs to user
    const attempt = await this.attemptRepository.findOne({
      where: {
        attemptId,
        userId: authContext.userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new Error('Cannot submit answer to completed attempt');
    }

    // Get question to validate answer format
    const question = await this.findQuestionById(submitAnswerDto.questionId, authContext);

    // Validate answer based on question type
    this.validateAnswer(submitAnswerDto.answer, question);

    // Convert answer to JSON string
    const answerJson = JSON.stringify(submitAnswerDto.answer);

    // Save or update answer
    const existingAnswer = await this.testUserAnswerRepository.findOne({
      where: {
        attemptId,
        questionId: submitAnswerDto.questionId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (existingAnswer) {
      existingAnswer.answer = answerJson;
      existingAnswer.updatedAt = new Date();
      await this.testUserAnswerRepository.save(existingAnswer);
    } else {
      const userAnswer = this.testUserAnswerRepository.create({
        attemptId,
        questionId: submitAnswerDto.questionId,
        answer: answerJson,
        anssOrder: '1', // This could be enhanced to track order
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      });
      await this.testUserAnswerRepository.save(userAnswer);
    }

    // Update attempt time spent if provided
    if (submitAnswerDto.timeSpent) {
      attempt.timeSpent = (attempt.timeSpent || 0) + submitAnswerDto.timeSpent;
      await this.attemptRepository.save(attempt);
    }

    // Trigger plugin event
    await this.triggerPluginEvent(PluginManagerService.EVENTS.ANSWER_SUBMITTED, authContext, {
      attemptId,
      questionId: submitAnswerDto.questionId,
      timeSpent: submitAnswerDto.timeSpent,
      answer: submitAnswerDto.answer,
    });
  }

  async submitAttempt(attemptId: string, authContext: AuthContext): Promise<TestAttempt & { totalMarks: number }> {
    const attempt = await this.findAttemptById(attemptId, authContext);

    // Check if attempt is already submitted
    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new Error('Attempt is already submitted');
    }

    // Get test information
    const testId = attempt.resolvedTestId || attempt.testId;
    const test = await this.findTestById(testId, authContext);

    // Calculate total marks for this attempt
    const totalMarks = await this.calculateTotalMarks(attemptId, authContext);

    // Get all answers and questions for this attempt
    const { userAnswers, questionMap } = await this.getAttemptAnswersAndQuestions(attemptId, authContext);

    // Determine evaluation strategy based on test.isObjective flag
    if (test.isObjective) {
      await this.handleObjectiveTestSubmission(attempt, test, userAnswers, questionMap, authContext);
    } else {
      await this.handleMixedTestSubmission(attempt, test, userAnswers, questionMap, authContext);
    }

    // Update attempt status
    attempt.status = AttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.submissionType = SubmissionType.SELF;

    const savedAttempt = await this.attemptRepository.save(attempt);

    // Trigger plugin event
    await this.triggerPluginEvent(PluginManagerService.EVENTS.ATTEMPT_SUBMITTED, authContext, {
      attemptId: savedAttempt.attemptId,
      testId: savedAttempt.testId,
      score: savedAttempt.score,
      result: savedAttempt.result,
      timeSpent: savedAttempt.timeSpent,
      reviewStatus: savedAttempt.reviewStatus,
      isObjective: test.isObjective,
    });

    return { ...savedAttempt, totalMarks };
  }

  async reviewAttempt(attemptId: string, reviewDto: ReviewAttemptDto, authContext: AuthContext): Promise<TestAttempt> {
    const attempt = await this.findAttemptById(attemptId, authContext);

    // Update scores for reviewed answers
    for (const answerReview of reviewDto.answers) {
      await this.testUserAnswerRepository.update(
        {
          attemptId,
          questionId: answerReview.questionId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
        {
          score: answerReview.score,
          remarks: answerReview.remarks,
          reviewedBy: authContext.userId,
          reviewStatus: 'R' as any, // REVIEWED
          reviewedAt: new Date(),
        }
      );
    }

    // Calculate final score
    const finalScore = await this.calculateFinalScore(attemptId, authContext);
    
    attempt.score = finalScore;
    attempt.result = finalScore >= 60 ? ResultType.PASS : ResultType.FAIL;
    attempt.reviewStatus = ReviewStatus.REVIEWED;
    attempt.updatedBy = authContext.userId;

    const savedAttempt = await this.attemptRepository.save(attempt);

    // Trigger plugin event
    await this.triggerPluginEvent(PluginManagerService.EVENTS.ATTEMPT_REVIEWED, authContext, {
      attemptId: savedAttempt.attemptId,
      testId: savedAttempt.testId,
      score: savedAttempt.score,
      result: savedAttempt.result,
      reviewedBy: authContext.userId,
      answersReviewed: reviewDto.answers.length,
    });

    return savedAttempt;
  }

  async getPendingReviews(authContext: AuthContext): Promise<any[]> {
    return this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('testUserAnswers', 'answers', 'answers.attemptId = attempt.attemptId')
      .leftJoin('questions', 'question', 'question.questionId = answers.questionId')
      .where('attempt.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('attempt.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('attempt.reviewStatus = :reviewStatus', { reviewStatus: ReviewStatus.PENDING })
      .andWhere('question.gradingType = :gradingType', { gradingType: GradingType.EXERCISE })
      .andWhere('answers.reviewStatus = :answerReviewStatus', { answerReviewStatus: 'P' })
      .select([
        'attempt.attemptId',
        'attempt.testId',
        'attempt.userId',
        'attempt.submittedAt',
        'answers.questionId',
        'question.text as title',
        'question.type',
        'question.marks',
        'question.gradingType',
        'question.params'
      ])
      .getMany();
  }

  private async generateRuleBasedTestQuestions(attempt: TestAttempt, originalTest: Test, authContext: AuthContext): Promise<void> {
    // Create a new generated test for this specific attempt
    const generatedTest = this.testRepository.create({
      title: `Generated Test for ${originalTest.title} - Attempt ${attempt.attempt}`,
      type: TestType.GENERATED,
      timeDuration: originalTest.timeDuration,
      attempts: 1, // Generated tests can only be attempted once
      passingMarks: originalTest.passingMarks,
      description: originalTest.description,
      status: originalTest.status,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
      createdBy: 'system',
    });

    const savedGeneratedTest = await this.testRepository.save(generatedTest);

    // Link the attempt to the generated test
    attempt.resolvedTestId = savedGeneratedTest.testId;
    await this.attemptRepository.save(attempt);

    // Get rules for the original test
    const rules = await this.testRuleRepository.find({
      where: {
        testId: originalTest.testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        isActive: true,
      },
      order: { priority: 'DESC' },
    });

    let questionOrder = 1;

    for (const rule of rules) {
      let selectedQuestionIds: string[] = [];

      if (rule.selectionMode === 'PRESELECTED') {
        // Approach A: Use pre-selected questions from testQuestions table
        const availableQuestions = await this.testQuestionRepository.find({
          where: {
            testId: originalTest.testId,
            ruleId: rule.ruleId,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          },
          order: { ordering: 'ASC' },
        });

        if (availableQuestions.length < rule.numberOfQuestions) {
          throw new Error(`Not enough pre-selected questions for rule ${rule.name}. Found ${availableQuestions.length}, required ${rule.numberOfQuestions}`);
        }

        // Select questions based on rule strategy
        const selectedQuestions = this.selectQuestionsFromRule(
          availableQuestions,
          rule.numberOfQuestions,
          rule.selectionStrategy
        );

        selectedQuestionIds = selectedQuestions.map(q => q.questionId);
      } else {
        // Approach B: Dynamic selection based on criteria
        const questionIds = await this.questionPoolService.generateQuestionPool(rule.ruleId, authContext);

        if (questionIds.length < rule.numberOfQuestions) {
          throw new Error(`Not enough questions available for rule ${rule.name}. Found ${questionIds.length}, required ${rule.numberOfQuestions}`);
        }

        // Select questions based on rule strategy
        selectedQuestionIds = this.selectQuestionsFromPool(
          questionIds,
          rule.numberOfQuestions,
          rule.selectionStrategy
        );
      }

      // Add selected questions to the generated test
      for (const questionId of selectedQuestionIds) {
        await this.testQuestionRepository.save(
          this.testQuestionRepository.create({
            testId: savedGeneratedTest.testId,
            sectionId: rule.sectionId,
            questionId: questionId,
            ordering: questionOrder++,
            ruleId: rule.ruleId,
            isCompulsory: false, // Questions from rules are not compulsory by default
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          })
        );
      }
    }
  }

  private selectQuestionsFromPool(questionIds: string[], count: number, strategy: string): string[] {
    switch (strategy) {
      case 'random':
        return this.shuffleArray(questionIds).slice(0, count);
      case 'sequential':
        return questionIds.slice(0, count);
      case 'weighted':
        // For weighted strategy, you might want to implement more complex logic
        // For now, using random selection
        return this.shuffleArray(questionIds).slice(0, count);
      default:
        return this.shuffleArray(questionIds).slice(0, count);
    }
  }

  private selectQuestionsFromRule(availableQuestions: TestQuestion[], count: number, strategy: string): TestQuestion[] {
    switch (strategy) {
      case 'random':
        return this.shuffleArray([...availableQuestions]).slice(0, count);
      case 'sequential':
        return availableQuestions.slice(0, count);
      case 'weighted':
        // For weighted strategy, you might want to implement more complex logic
        // For now, using random selection
        return this.shuffleArray([...availableQuestions]).slice(0, count);
      default:
        return this.shuffleArray([...availableQuestions]).slice(0, count);
    }
  }

  private validateAnswer(answer: any, question: Question): void {
    switch (question.type) {
      case QuestionType.MCQ:
      case QuestionType.TRUE_FALSE:
        if (!answer.selectedOptionIds || answer.selectedOptionIds.length !== 1) {
          throw new Error('MCQ/True-False questions require exactly one selected option');
        }
        break;
      case QuestionType.MULTIPLE_ANSWER:
        if (!answer.selectedOptionIds || answer.selectedOptionIds.length === 0) {
          throw new Error('Multiple answer questions require at least one selected option');
        }
        break;
      case QuestionType.SUBJECTIVE:
      case QuestionType.ESSAY:
        if (!answer.text || answer.text.trim().length === 0) {
          throw new Error('Subjective/Essay questions require text answer');
        }
        if (question.params?.maxLength && answer.text.length > question.params.maxLength) {
          throw new Error(`Answer exceeds maximum length of ${question.params.maxLength} characters`);
        }
        if (question.params?.minLength && answer.text.length < question.params.minLength) {
          throw new Error(`Answer must be at least ${question.params.minLength} characters`);
        }
        break;
      case QuestionType.FILL_BLANK:
        if (!answer.blanks || answer.blanks.length === 0) {
          throw new Error('Fill-in-the-blank questions require blank answers');
        }
        break;
      case QuestionType.MATCH:
        if (!answer.matches || answer.matches.length === 0) {
          throw new Error('Matching questions require match answers');
        }
        break;
    }
  }

  private async hasSubjectiveQuestions(attemptId: string, authContext: AuthContext): Promise<boolean> {
    const subjectiveQuestions = await this.questionRepository
      .createQueryBuilder('question')
      .innerJoin('testUserAnswers', 'answers', 'answers.questionId = question.questionId')
      .where('answers.attemptId = :attemptId', { attemptId })
      .andWhere('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('question.gradingType = :gradingType', { gradingType: GradingType.EXERCISE })
      .getCount();

    return subjectiveQuestions > 0;
  }

  private async calculateObjectiveScore(attemptId: string, authContext: AuthContext): Promise<number> {
    const answers = await this.testUserAnswerRepository
      .createQueryBuilder('answer')
      .innerJoin('questions', 'question', 'question.questionId = answer.questionId')
      .where('answer.attemptId = :attemptId', { attemptId })
      .andWhere('answer.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('answer.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('question.gradingType = :gradingType', { gradingType: GradingType.QUIZ })
      .select(['answer.answer', 'question.marks', 'question.type'])
      .getMany();

    let totalScore = 0;
    let totalMarks = 0;

    for (const answer of answers) {
      const question = await this.questionRepository.findOne({
        where: { questionId: answer.questionId },
      });
      
      if (question) {
        totalMarks += question.marks;
        const answerData = JSON.parse(answer.answer);
        
        // Calculate score based on question type
        const score = this.calculateQuestionScore(answerData, question);
        totalScore += score;
      }
    }

    return totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  }

  private calculateQuestionScore(answerData: any, question: Question): number {
    // This is a simplified scoring logic - you might want to enhance it
    switch (question.type) {
      case QuestionType.MCQ:
      case QuestionType.TRUE_FALSE:
        // Check if selected option is correct
        return answerData.selectedOptionIds?.length > 0 ? question.marks : 0;
      case QuestionType.MULTIPLE_ANSWER:
        // Partial scoring for multiple answer questions
        return question.marks; // Simplified - you'd need to check each option
      default:
        return 0; // Subjective questions are scored manually
    }
  }

  private async calculateFinalScore(attemptId: string, authContext: AuthContext): Promise<number> {
    const { answers, totalMarks } = await this.getAttemptAnswersWithMarks(attemptId, authContext);
    
    let totalScore = 0;
    for (const answer of answers) {
      totalScore += answer.score || 0;
    }

    return totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  }

  private async calculateTotalMarks(attemptId: string, authContext: AuthContext): Promise<number> {
    const { totalMarks } = await this.getAttemptAnswersWithMarks(attemptId, authContext);
    return totalMarks;
  }

  private async getAttemptAnswersWithMarks(attemptId: string, authContext: AuthContext): Promise<{ answers: TestUserAnswer[], totalMarks: number }> {
    const answers = await this.testUserAnswerRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    let totalMarks = 0;
    for (const answer of answers) {
      const question = await this.questionRepository.findOne({
        where: { questionId: answer.questionId },
      });

      if (question) {
        totalMarks += question.marks;
      }
    }

    return { answers, totalMarks };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async getAttemptAnswersAndQuestions(attemptId: string, authContext: AuthContext): Promise<{ userAnswers: TestUserAnswer[], questionMap: Map<string, Question> }> {
    // Get all answers for this attempt
    const userAnswers = await this.testUserAnswerRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    // Get questions for the answers
    const questionIds = userAnswers.map(answer => answer.questionId);
    const questions = await this.questionRepository.find({
      where: {
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    const questionMap = new Map(questions.map(q => [q.questionId, q]));

    return { userAnswers, questionMap };
  }

  private async updateAnswerScore(
    attemptId: string, 
    questionId: string, 
    score: number | null, 
    reviewStatus: AnswerReviewStatus, 
    authContext: AuthContext
  ): Promise<void> {
    await this.testUserAnswerRepository.update(
      {
        attemptId,
        questionId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      {
        reviewStatus,
        score,
      }
    );
  }

  private async handleObjectiveTestSubmission(attempt: TestAttempt, test: Test, userAnswers: TestUserAnswer[], questionMap: Map<string, Question>, authContext: AuthContext): Promise<void> {
    // Auto-evaluate all questions (objective test)
    const score = await this.calculateObjectiveScore(attempt.attemptId, authContext);
    const validatedScore = Number(score) || 0;
    attempt.score = validatedScore;
    attempt.result = validatedScore >= test.passingMarks ? ResultType.PASS : ResultType.FAIL;
    attempt.reviewStatus = ReviewStatus.NOT_APPLICABLE;

    // Process all answers as objective questions
    await this.processAnswersAsObjective(userAnswers, questionMap, attempt.attemptId, authContext);
  }

  private async handleMixedTestSubmission(attempt: TestAttempt, test: Test, userAnswers: TestUserAnswer[], questionMap: Map<string, Question>, authContext: AuthContext): Promise<void> {
    // Check if test has subjective questions
    const hasSubjectiveQuestions = await this.hasSubjectiveQuestions(attempt.attemptId, authContext);
    
    if (hasSubjectiveQuestions) {
      // Auto-evaluate objective questions and mark subjective for review
      const objectiveScore = await this.calculateObjectiveScore(attempt.attemptId, authContext);
      const validatedObjectiveScore = Number(objectiveScore) || 0;
      attempt.score = validatedObjectiveScore;
      attempt.result = null;
      attempt.reviewStatus = ReviewStatus.PENDING;

      // Process answers based on question type
      await this.processMixedAnswers(userAnswers, questionMap, attempt.attemptId, authContext);
    } else {
      // All questions are objective, auto-evaluate
      const score = await this.calculateObjectiveScore(attempt.attemptId, authContext);
      const validatedScore = Number(score) || 0;
      attempt.score = validatedScore;
      attempt.result = validatedScore >= test.passingMarks ? ResultType.PASS : ResultType.FAIL;
      attempt.reviewStatus = ReviewStatus.NOT_APPLICABLE;

      // Process all answers as objective questions
      await this.processAnswersAsObjective(userAnswers, questionMap, attempt.attemptId, authContext);
    }
  }

  private async processAnswersAsObjective(userAnswers: TestUserAnswer[], questionMap: Map<string, Question>, attemptId: string, authContext: AuthContext): Promise<void> {
    for (const answer of userAnswers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      const needsUpdate = this.needsScoreUpdate(answer);
      if (needsUpdate) {
        const questionScore = this.calculateQuestionScore(JSON.parse(answer.answer), question);
        const validatedQuestionScore = Number(questionScore) || 0;
        
        await this.updateAnswerScore(
          attemptId,
          answer.questionId,
          validatedQuestionScore,
          AnswerReviewStatus.NOT_APPLICABLE,
          authContext
        );
      }
    }
  }

  private async processMixedAnswers(userAnswers: TestUserAnswer[], questionMap: Map<string, Question>, attemptId: string, authContext: AuthContext): Promise<void> {
    for (const answer of userAnswers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      const isSubjective = this.isSubjectiveQuestion(question);
      
      if (isSubjective) {
        await this.markAnswerForReview(answer, attemptId, authContext);
      } else {
        await this.processObjectiveAnswer(answer, question, attemptId, authContext);
      }
    }
  }

  private needsScoreUpdate(answer: TestUserAnswer): boolean {
    return answer.score === null || 
           answer.score === undefined || 
           answer.reviewStatus !== AnswerReviewStatus.NOT_APPLICABLE;
  }

  private isSubjectiveQuestion(question: Question): boolean {
    return question.type === QuestionType.SUBJECTIVE || question.type === QuestionType.ESSAY;
  }

  private async markAnswerForReview(answer: TestUserAnswer, attemptId: string, authContext: AuthContext): Promise<void> {
    if (answer.reviewStatus !== AnswerReviewStatus.PENDING) {
      await this.updateAnswerScore(
        attemptId,
        answer.questionId,
        null,
        AnswerReviewStatus.PENDING,
        authContext
      );
    }
  }

  private async processObjectiveAnswer(answer: TestUserAnswer, question: Question, attemptId: string, authContext: AuthContext): Promise<void> {
    const needsUpdate = this.needsScoreUpdate(answer);
    if (needsUpdate) {
      const questionScore = this.calculateQuestionScore(JSON.parse(answer.answer), question);
      const validatedQuestionScore = Number(questionScore) || 0;
      
      await this.updateAnswerScore(
        attemptId,
        answer.questionId,
        validatedQuestionScore,
        AnswerReviewStatus.NOT_APPLICABLE,
        authContext
      );
    }
  }

  private async findAttemptById(attemptId: string, authContext: AuthContext): Promise<TestAttempt> {
    const attempt = await this.attemptRepository.findOne({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return attempt;
  }

  private async findTestById(testId: string, authContext: AuthContext): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    return test;
  }

  private async findQuestionById(questionId: string, authContext: AuthContext): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: {
        questionId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  private async triggerPluginEvent(eventName: string, authContext: AuthContext, eventData: any): Promise<void> {
    await this.pluginManager.triggerEvent(
      eventName,
      {
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        userId: authContext.userId,
      },
      eventData
    );
  }
} 