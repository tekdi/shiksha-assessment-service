import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TestAttempt, AttemptStatus, SubmissionType, ReviewStatus, ResultType } from '../tests/entities/test-attempt.entity';
import { TestUserAnswer, ReviewStatus as AnswerReviewStatus } from '../tests/entities/test-user-answer.entity';
import { Test, TestType, TestStatus, AttemptsGradeMethod } from '../tests/entities/test.entity';
import { TestQuestion } from '../tests/entities/test-question.entity';
import { TestRule } from '../tests/entities/test-rule.entity';
import { Question, QuestionType } from '../questions/entities/question.entity';
import { QuestionOption } from '../questions/entities/question-option.entity';
import { GradingType } from '../tests/entities/test.entity';
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
    @InjectRepository(QuestionOption)
    private readonly questionOptionRepository: Repository<QuestionOption>,
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
      relations: ['test'],
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

  async submitAttempt(attemptId: string, authContext: AuthContext): Promise<TestAttempt> {
    const attempt = await this.attemptRepository.findOne({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['test'],
    });

    // Check if attempt is already submitted
    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new Error('Attempt is already submitted');
    }

    // Get test information
    const testId = attempt.resolvedTestId || attempt.testId;
    const test = await this.findTestById(testId, authContext);

    // Check if the test itself is a FEEDBACK type test
    if (attempt.test?.gradingType === GradingType.FEEDBACK) {
      // For feedback tests, set score to null and result to FEEDBACK
      attempt.score = null;
      attempt.result = null;
    } else {
      
      if (!test.isObjective) {  
        // Auto-calculate score for objective questions (if any) 
        const score = await this.calculateObjectiveScore(attemptId, authContext);
        attempt.score = score;
        // Set review status to pending for manual review
        attempt.reviewStatus = ReviewStatus.PENDING;
      } else {
        // Auto-calculate score for objective questions
        const score = await this.calculateObjectiveScore(attemptId, authContext);
        attempt.score = score;
        attempt.reviewStatus = ReviewStatus.REVIEWED;
        attempt.result = score >= test.passingMarks ? ResultType.PASS : ResultType.FAIL;
      }
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

    return savedAttempt;
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
      .andWhere('question.gradingType = :gradingType', { gradingType: GradingType.ASSIGNMENT })
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

  /**
   * Generates questions for a rule-based test attempt by creating a new generated test
   * and populating it with questions based on the test rules.
   * 
   * This function:
   * 1. Creates a new generated test instance for the specific attempt
   * 2. Links the attempt to the generated test via resolvedTestId
   * 3. Retrieves all active rules for the original test
   * 4. For each rule, selects questions either from pre-selected pool or dynamic criteria
   * 5. Adds selected questions to the generated test with proper ordering
   * 
   * @param attempt - The test attempt that needs questions generated
   * @param originalTest - The original rule-based test
   * @param authContext - Authentication context for tenant/organization filtering
   */
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

  /**
   * Selects a specified number of questions from a pool of question IDs based on the given strategy.
   *    * 
   * @param questionIds - Array of question IDs to select from
   * @param count - Number of questions to select
   * @param strategy - Selection strategy ('random', 'sequential', 'weighted')
   * @returns Array of selected question IDs
   */
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

  /**
   * Selects a specified number of questions from pre-selected questions in a rule based on the given strategy.
   * 
   * @param availableQuestions - Array of TestQuestion entities to select from
   * @param count - Number of questions to select
   * @param strategy - Selection strategy ('random', 'sequential', 'weighted')
   * @returns Array of selected TestQuestion entities
   */
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

  /**
   * Validates a user's answer against the question's expected format and constraints.
   * 
   * This function performs type-specific validation:
   * - MCQ/True-False: Ensures exactly one option is selected
   * - Multiple Answer: Ensures at least one option is selected
   * - Subjective/Essay: Ensures text is provided and meets length constraints
   * - Fill-in-the-blank: Ensures blank answers are provided
   * - Matching: Ensures match answers are provided
   * 
   * Throws descriptive error messages for validation failures.
   * 
   * @param answer - The user's answer object
   * @param question - The question entity with type and constraints
   * @throws Error when validation fails
   */
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


  /**
   * Calculates the objective score for an attempt by auto-evaluating all objective questions.
   * 
   * This function:
   * 1. Retrieves all answers for the attempt that have grading type 'QUIZ' (objective questions)
   * 2. For each answer, calculates the score based on the question type and user's response
   * 3. Sums up all scores and calculates the percentage based on total possible marks
   * 
   * Only processes questions with grading type 'QUIZ' (objective questions that can be auto-scored).
   * 
   * @param attemptId - The ID of the test attempt to score
   * @param authContext - Authentication context for tenant/organization filtering
   * @returns Promise<number> - The calculated objective score as a percentage
   */
  private async calculateObjectiveScore(attemptId: string, authContext: AuthContext): Promise<number> {
    const answers = await this.testUserAnswerRepository
      .createQueryBuilder('answer')
      .innerJoin('questions', 'question', 'question.questionId = answer.questionId')
      .where('answer.attemptId = :attemptId', { attemptId })
      .andWhere('answer.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('answer.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('question.type NOT IN (:...types)', { types: [QuestionType.SUBJECTIVE, QuestionType.ESSAY] })
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
        const score = await this.calculateQuestionScore(answerData, question);
        //update answer score
        await this.updateAnswerScore(
          attemptId,
          answer.questionId,
          score,
          AnswerReviewStatus.REVIEWED,
          authContext
        );
        totalScore += score;
      }
    }

    return totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  }

   /**
   * Updates the score and review status for a specific answer in an attempt.
   * 
   * Used during both auto-scoring of objective questions and manual review of subjective questions.
   * 
   * @param attemptId - The ID of the test attempt
   * @param questionId - The ID of the question being scored
   * @param score - The calculated score for the answer (can be null for pending review)
   * @param reviewStatus - The review status for the answer
   * @param authContext - Authentication context for tenant/organization filtering
   */
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
  

  /**
   * Calculates the score for a single question based on the user's answer and question type.
   *
   * This method implements comprehensive scoring logic for each question type:
   * - MCQ/TRUE_FALSE: Full marks if correct option selected, 0 otherwise
   * - MULTIPLE_ANSWER: Partial scoring based on correct/incorrect selections (configurable)
   * - FILL_BLANK: Configurable partial scoring for each correct blank with case sensitivity
   * - MATCH: Configurable partial scoring for each correct match
   * - SUBJECTIVE/ESSAY: Returns 0 (scored manually)
   * 
   * @param answerData - The parsed user answer data
   * @param question - The question entity with type and marks
   * @returns number - The calculated score for this question
   */
  private async calculateQuestionScore(answerData: any, question: Question): Promise<number> {
    // Get question options for validation
    const options = await this.getQuestionOptions(question.questionId);
    
    switch (question.type) {
      case QuestionType.MCQ:
      case QuestionType.TRUE_FALSE:
        return this.calculateMCQScore(answerData, question, options);
        
      case QuestionType.MULTIPLE_ANSWER:
        return this.calculateMultipleAnswerScore(answerData, question, options);
        
      case QuestionType.FILL_BLANK:
        return this.calculateFillBlankScore(answerData, question, options);
        
      case QuestionType.MATCH:
        return this.calculateMatchScore(answerData, question, options);
        
      case QuestionType.SUBJECTIVE:
      case QuestionType.ESSAY:
        // Subjective questions are scored manually
        return 0;
        
      default:
        return 0;
    }
  }

  /**
   * Calculates score for MCQ and TRUE_FALSE questions.
   * Full marks if correct option selected, 0 otherwise.
   */
  private calculateMCQScore(answerData: any, question: Question, options: QuestionOption[]): number {
    const selectedOptionIds = answerData.selectedOptionIds || [];
    
    // MCQ should have exactly one correct option
    const correctOption = options.find(opt => opt.isCorrect);
    if (!correctOption) return 0;
    
    // Check if the selected option is correct
    const isCorrect = selectedOptionIds.length === 1 && 
                     selectedOptionIds[0] === correctOption.questionOptionId;
    
    return isCorrect ? question.marks : 0;
  }

  /**
   * Calculates score for MULTIPLE_ANSWER questions with partial scoring.
   * Supports both full marks for all correct or partial scoring per option.
   */
  private calculateMultipleAnswerScore(answerData: any, question: Question, options: QuestionOption[]): number {
    const selectedOptionIds = answerData.selectedOptionIds || [];
    const correctOptions = options.filter(opt => opt.isCorrect);
    
    if (correctOptions.length === 0) return 0;
    
    let totalScore = 0;
    
    // Award marks for correct selections
    for (const correctOption of correctOptions) {
      if (selectedOptionIds.includes(correctOption.questionOptionId)) {
        totalScore += correctOption.marks;
      }
    }
    // Check if partial scoring is enabled
    if (question.allowPartialScoring) {
      return totalScore;
    } else {
      // Full marks only if all correct options selected and no incorrect ones
      return totalScore === question.marks ? question.marks : 0;
    }
  }

  /**
   * Calculates score for FILL_BLANK questions.
   * Supports case sensitivity and exact matching with configurable partial scoring.
   */
  private calculateFillBlankScore(answerData: any, question: Question, options: QuestionOption[]): number {
    const userBlanks = answerData.blanks || [];
    const correctOptions = options.filter(opt => opt.isCorrect);
    
    if (correctOptions.length === 0 || userBlanks.length === 0) return 0;
    
    let totalScore = 0;
    
    for (let i = 0; i < Math.min(userBlanks.length, correctOptions.length); i++) {
      const userAnswer = userBlanks[i]?.trim();
      const correctAnswer = correctOptions[i]?.text?.trim();
      
      if (!userAnswer || !correctAnswer) continue;
      
      // Check case sensitivity
      const isCaseSensitive = correctOptions[i]?.caseSensitive || false;
      const isCorrect = isCaseSensitive 
        ? userAnswer === correctAnswer
        : userAnswer.toLowerCase() === correctAnswer.toLowerCase();
      
      if (isCorrect) {
        // Use individual option marks instead of equal distribution
        totalScore += correctOptions[i]?.marks || 0;
      }
    }
    
    // Check if partial scoring is enabled
    if (question.allowPartialScoring) {
      // Partial scoring: award marks for each correct blank using option marks
      return totalScore;
    } else {
      // All-or-nothing: full marks only if all blanks are correct
      return totalScore === question.marks ? question.marks : 0;
    }
  }

  /**
   * Calculates score for MATCH questions.
   * Configurable partial scoring for each correct match.
   */
  private calculateMatchScore(answerData: any, question: Question, options: QuestionOption[]): number {
    const userMatches = answerData.matches || [];
    const correctOptions = options.filter(opt => opt.isCorrect);
    
    if (correctOptions.length === 0 || userMatches.length === 0) return 0;
    
    let totalScore = 0;
    
    for (let i = 0; i < Math.min(userMatches.length, correctOptions.length); i++) {
      const userMatch = userMatches[i];
      const correctMatch = correctOptions[i]?.matchWith;
      
      if (userMatch === correctMatch) {
        // Use individual option marks instead of equal distribution
        totalScore += correctOptions[i]?.marks || 0;
      }
    }
    
    // Check if partial scoring is enabled
    if (question.allowPartialScoring) {
      // Partial scoring: award marks for each correct match using option marks
      return totalScore;
    } else {
      // All-or-nothing: full marks only if all matches are correct
      return totalScore === question.marks ? question.marks : 0;
    }
  }

  /**
   * Retrieves question options for scoring validation.
   */
  private async getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
    return this.questionOptionRepository.find({
      where: { questionId },
      order: { ordering: 'ASC' },
    });
  }

  /**
   * Calculates the final score for an attempt after manual review of subjective questions.
   * 
   * This is used after manual review when all subjective questions have been scored.
   * 
   * @param attemptId - The ID of the test attempt to calculate final score for
   * @param authContext - Authentication context for tenant/organization filtering
   * @returns Promise<number> - The final score as a percentage
   */
  private async calculateFinalScore(attemptId: string, authContext: AuthContext): Promise<number> {
    const { answers, totalMarks } = await this.getAttemptAnswersWithMarks(attemptId, authContext);
    
    let totalScore = 0;
    for (const answer of answers) {
      totalScore += answer.score || 0;
    }

    return totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  }

  /**
   * Retrieves all answers for an attempt along with the total possible marks.
   * 
   * This function:
   * 1. Fetches all user answers for the specified attempt
   * 2. For each answer, retrieves the associated question to get its marks
   * 3. Calculates the total possible marks by summing all question marks
   * 
   * @param attemptId - The ID of the test attempt
   * @param authContext - Authentication context for tenant/organization filtering
   * @returns Promise<{answers: TestUserAnswer[], totalMarks: number}> - Object containing answers and total marks
   */
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

  /**
   * Shuffles an array using the Fisher-Yates shuffle algorithm.
   * 
   * This function creates a copy of the input array and randomly reorders its elements
   * using the Fisher-Yates (Knuth) shuffle algorithm for unbiased randomization.
   * 
   * @param array - The array to shuffle
   * @returns T[] - A new array with the same elements in random order
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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