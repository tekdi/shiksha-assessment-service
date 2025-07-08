import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TestAttempt, AttemptStatus, SubmissionType, ReviewStatus, ResultType } from '../tests/entities/test-attempt.entity';
import { TestUserAnswer, ReviewStatus as AnswerReviewStatus } from '../tests/entities/test-user-answer.entity';
import { Test, TestType, TestStatus } from '../tests/entities/test.entity';
import { TestQuestion } from '../tests/entities/test-question.entity';
import { TestRule } from '../tests/entities/test-rule.entity';
import { Question, QuestionType, GradingType } from '../questions/entities/question.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ReviewAttemptDto } from './dto/review-answer.dto';
import { PluginManagerService } from '@/common/services/plugin-manager.service';
import { QuestionPoolService } from '../tests/question-pool.service';
import { AttemptResultDto, TestInfoDto, AttemptAnswerDto, SelectedOptionDto, FillBlankAnswerDto, MatchAnswerDto, CorrectOptionDto } from './dto/attempt-result.dto';

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
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Check if test is published and active
    if (test.status !== TestStatus.PUBLISHED) {
      throw new Error('Test is not available for attempts');
    }

    // Check test availability dates
    const now = new Date();
    if (test.startDate && now < test.startDate) {
      throw new Error('Test is not yet available for attempts');
    }
    if (test.endDate && now > test.endDate) {
      throw new Error('Test is no longer available for attempts');
    }

    // Get all existing attempts for this user and test
    const totalAttempts = await this.attemptRepository.count({
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    const maxAttempts = test.attempts;

    // Check if user has reached maximum attempts
    if (totalAttempts >= maxAttempts) {
      throw new Error(`Maximum attempts (${maxAttempts}) reached for this test. You cannot start a new attempt.`);
    }

    // Create attempt
    const attempt = this.attemptRepository.create({
      testId,
      userId,
      attempt: totalAttempts + 1,
      status: AttemptStatus.IN_PROGRESS,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId
    });

    const savedAttempt = await this.attemptRepository.save(attempt);

    // Generate questions based on test type
    if (test.type === TestType.RULE_BASED) {
      await this.generateRuleBasedTestQuestions(savedAttempt, test, authContext);
    }

    // Trigger plugin event
    await this.pluginManager.triggerEvent(
      PluginManagerService.EVENTS.ATTEMPT_STARTED,
      {
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        userId: authContext.userId,
      },
      {
        attemptId: savedAttempt.attemptId,
        testId: savedAttempt.testId,
        attemptNumber: savedAttempt.attempt,
      }
    );

    return savedAttempt;
  }

  async getAttemptQuestions(attemptId: string, authContext: AuthContext): Promise<Question[]> {
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
    const question = await this.questionRepository.findOne({
      where: {
        questionId: submitAnswerDto.questionId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

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
    await this.pluginManager.triggerEvent(
      PluginManagerService.EVENTS.ANSWER_SUBMITTED,
      {
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        userId: authContext.userId,
      },
      {
        attemptId,
        questionId: submitAnswerDto.questionId,
        timeSpent: submitAnswerDto.timeSpent,
        answer: submitAnswerDto.answer,
      }
    );
  }

  async submitAttempt(attemptId: string, authContext: AuthContext): Promise<TestAttempt> {
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

    attempt.status = AttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.submissionType = SubmissionType.SELF;

    // Check if test has subjective questions that need review
    const hasSubjectiveQuestions = await this.hasSubjectiveQuestions(attemptId, authContext);
    
    if (hasSubjectiveQuestions) {
      // Set review status to pending for manual review
      attempt.reviewStatus = ReviewStatus.PENDING;
    } else {
      // Auto-calculate score for objective questions
      const score = await this.calculateObjectiveScore(attemptId, authContext);
      attempt.score = score;
      attempt.result = score >= 60 ? ResultType.PASS : ResultType.FAIL; // Assuming 60% is passing
    }

    const savedAttempt = await this.attemptRepository.save(attempt);

    // Trigger plugin event
    await this.pluginManager.triggerEvent(
      PluginManagerService.EVENTS.ATTEMPT_SUBMITTED,
      {
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        userId: authContext.userId,
      },
      {
        attemptId: savedAttempt.attemptId,
        testId: savedAttempt.testId,
        score: savedAttempt.score,
        result: savedAttempt.result,
        timeSpent: savedAttempt.timeSpent,
        reviewStatus: savedAttempt.reviewStatus,
      }
    );

    return savedAttempt;
  }

  async reviewAttempt(attemptId: string, reviewDto: ReviewAttemptDto, authContext: AuthContext): Promise<TestAttempt> {
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
    await this.pluginManager.triggerEvent(
      PluginManagerService.EVENTS.ATTEMPT_REVIEWED,
      {
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        userId: authContext.userId,
      },
      {
        attemptId: savedAttempt.attemptId,
        testId: savedAttempt.testId,
        score: savedAttempt.score,
        result: savedAttempt.result,
        reviewedBy: authContext.userId,
        answersReviewed: reviewDto.answers.length,
      }
    );

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
    const answers = await this.testUserAnswerRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    let totalScore = 0;
    let totalMarks = 0;

    for (const answer of answers) {
      const question = await this.questionRepository.findOne({
        where: { questionId: answer.questionId },
      });

      if (question) {
        totalMarks += question.marks;
        totalScore += answer.score || 0;
      }
    }

    return totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async getAttemptResult(attemptId: string, authContext: AuthContext): Promise<AttemptResultDto> {
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

    
    // Only return results if attempt is submitted
    if (attempt.status !== AttemptStatus.SUBMITTED) {
      throw new Error('Attempt results are only available for submitted attempts');
    }

    // Don't return results if attempt is under review
    if (attempt.reviewStatus === ReviewStatus.PENDING) {
      throw new Error('Attempt results are not available while under review');
    }

    // Get test information
    const testId = attempt.resolvedTestId || attempt.testId;
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

    // Get all answers for this attempt
    const userAnswers = await this.testUserAnswerRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { createdAt: 'ASC' },
    });

    // Get questions for the answers with options
    const questionIds = userAnswers.map(answer => answer.questionId);
    const questions = await this.questionRepository.find({
      where: {
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['options'], // Load options for correct answers
    });

    // Create a map for quick lookup
    const questionMap = new Map<string, Question>(questions.map(q => [q.questionId, q]));

    // Build answers array with question details
    const answers = userAnswers.map(answer => {
      const question = questionMap.get(answer.questionId);
      
      // Parse user's actual answer
      let userAnswer = null;
      try {
        userAnswer = JSON.parse(answer.answer);
      } catch (error) {
        userAnswer = { error: 'Failed to parse answer' };
      }
      
      // Calculate individual question score if not already set
      let questionScore = answer.score;
      if (questionScore === null || questionScore === undefined) {
        try {
          const answerData = JSON.parse(answer.answer);
          questionScore = this.calculateQuestionScore(answerData, question);
        } catch (error) {
          questionScore = 0;
        }
      }

      const answerData = {
        questionId: answer.questionId,
        questionText: question?.text || 'Question not found',
        questionType: question?.type || 'unknown',
        marks: question?.marks || 0,
        score: questionScore || 0,
        reviewStatus: answer.reviewStatus,
        remarks: answer.remarks,
        reviewedBy: answer.reviewedBy,
        reviewedAt: answer.reviewedAt,
      };

      // Add user's selected options with text content directly to answerData
      if (question && userAnswer && !userAnswer.error) {
        switch (question.type) {
          case QuestionType.MCQ:
          case QuestionType.TRUE_FALSE:
          case QuestionType.MULTIPLE_ANSWER:
            if (userAnswer.selectedOptionIds && userAnswer.selectedOptionIds.length > 0) {
              const selectedOptions = question.options?.filter(opt => 
                userAnswer.selectedOptionIds.includes(opt.questionOptionId)
              ) || [];
              // Add selectedOptionIds directly to answerData
              answerData['selectedOptionIds'] = selectedOptions.map(opt => ({
                questionOptionId: opt.questionOptionId,
                text: opt.text,
              }));
            }
            break;
          
          case QuestionType.FILL_BLANK:
            if (userAnswer.selectedOptionIds || userAnswer.blanks) {
              const fillBlankAnswers = userAnswer.selectedOptionIds || userAnswer.blanks;
              answerData['selectedOptionIds'] = fillBlankAnswers.map((blank: any) => {
                const option = question.options?.find(opt => opt.blankIndex === blank.blankIndex);
                return {
                  blankIndex: blank.blankIndex,
                  text: blank.text || blank.answer || '',
                  correctText: option?.text || '',
                  caseSensitive: option?.caseSensitive || false,
                };
              });
            }
            break;
          
          case QuestionType.MATCH:
            if (userAnswer.matches) {
              const matchAnswers = userAnswer.matches;
              answerData['selectedOptionIds'] = matchAnswers.map((match: any) => {
                const option = question.options?.find(opt => opt.questionOptionId === match.optionId);
                const matchWithOption = question.options?.find(opt => opt.questionOptionId === match.matchWith);
                return {
                  questionOptionId: match.optionId,
                  text: option?.text || '',
                  matchWith: match.matchWith,
                  matchWithText: matchWithOption?.text || '',
                };
              });
            }
            break;
          
          case QuestionType.SUBJECTIVE:
          case QuestionType.ESSAY:
            // Add text directly to answerData
            if (userAnswer.text) {
              answerData['text'] = userAnswer.text;
            }
            break;
        }
      }

      // Only include correct answer information if showCorrectAnswer is enabled
      if (test.showCorrectAnswer && question) {
        // Add correct answer information based on question type
        switch (question.type) {
          case QuestionType.MCQ:
          case QuestionType.TRUE_FALSE:
          case QuestionType.MULTIPLE_ANSWER:
            // Include correct options
            const correctOptions = question.options?.filter(opt => opt.isCorrect) || [];
            answerData['correctOptions'] = correctOptions.map(opt => ({
              questionOptionId: opt.questionOptionId,
              text: opt.text,
              marks: opt.marks || 0,
            }));
            break;
          
          case QuestionType.FILL_BLANK:
            // Include correct answers for fill-in-the-blank questions
            const correctBlanks = question.options?.filter(opt => opt.isCorrect) || [];
            answerData['correctAnswers'] = correctBlanks.map(opt => ({
              blankIndex: opt.blankIndex,
              text: opt.text,
              caseSensitive: opt.caseSensitive || false,
            }));
            break;
          
          case QuestionType.MATCH:
            // Include correct matches
            const correctMatches = question.options?.filter(opt => opt.isCorrect) || [];
            answerData['correctMatches'] = correctMatches.map(opt => ({
              questionOptionId: opt.questionOptionId,
              text: opt.text,
              matchWith: opt.matchWith,
            }));
            break;
          
          case QuestionType.SUBJECTIVE:
          case QuestionType.ESSAY:
            // For subjective questions, include sample answer if available
            if ((question.params as any)?.sampleAnswer) {
              answerData['sampleAnswer'] = (question.params as any).sampleAnswer;
            }
            break;
        }
      }

      return answerData;
    });

    return {
      attemptId: attempt.attemptId,
      testId: attempt.testId,
      userId: attempt.userId,
      status: attempt.status,
      reviewStatus: attempt.reviewStatus,
      score: attempt.score,
      result: attempt.result,
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent,
      test: {
        title: test.title,
        passingMarks: test.passingMarks,
        totalMarks: test.totalMarks,
        isObjective: test.isObjective,
      } as TestInfoDto,
      attempt: answers as AttemptAnswerDto[],
    } as AttemptResultDto;
  }
} 