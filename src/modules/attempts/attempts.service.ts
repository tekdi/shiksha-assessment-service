import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  TestAttempt,
  AttemptStatus,
  SubmissionType,
  ReviewStatus,
  ResultType,
} from '../tests/entities/test-attempt.entity';
import {
  TestUserAnswer,
  ReviewStatus as AnswerReviewStatus,
} from '../tests/entities/test-user-answer.entity';
import {
  Test,
  TestType,
  TestStatus,
  AttemptsGradeMethod,
} from '../tests/entities/test.entity';
import { TestQuestion } from '../tests/entities/test-question.entity';
import { TestRule } from '../tests/entities/test-rule.entity';
import { Question, QuestionType } from '../questions/entities/question.entity';
import { QuestionOption } from '../questions/entities/question-option.entity';
import { OptionQuestion } from '../questions/entities/option-question.entity';
import { GradingType } from '../tests/entities/test.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { SubmitMultipleAnswersDto } from './dto/submit-answer.dto';
import { ReviewAttemptDto } from './dto/review-answer.dto';
import { ReviewTestAttemptDto } from './dto/review-test-attempt.dto';
import { PluginManagerService } from '@/common/services/plugin-manager.service';
import { QuestionPoolService } from '../tests/question-pool.service';
import { ResumeAttemptDto } from './dto/resume-attempt.dto';
import { TestSection } from '../tests/entities/test-section.entity';
import { SectionStatus } from '../tests/dto/create-section.dto';
import { QuestionStatus } from '../questions/entities/question.entity';

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

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
    @InjectRepository(TestSection)
    private readonly testSectionRepository: Repository<TestSection>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly questionOptionRepository: Repository<QuestionOption>,
    @InjectRepository(OptionQuestion)
    private readonly optionQuestionRepository: Repository<OptionQuestion>,
    private readonly dataSource: DataSource,
    private readonly pluginManager: PluginManagerService,
    private readonly questionPoolService: QuestionPoolService,
    private readonly configService: ConfigService
  ) {}

  async startAttempt(
    testId: string,
    userId: string,
    authContext: AuthContext
  ): Promise<TestAttempt> {
    // Check if test exists and user can attempt
    const test = await this.testRepository.findOne({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        status: Not(TestStatus.ARCHIVED),
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
    // Handle allowResubmission logic
    if (test.allowResubmission) {
      // For tests with allowResubmission, check if user already has an attempt
      const existingAttempt = await this.attemptRepository.findOne({
        where: {
          testId,
          userId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
          status: In([AttemptStatus.IN_PROGRESS, AttemptStatus.SUBMITTED]),
        },
        order: { attempt: 'DESC' }, // Get the most recent attempt
      });

      if (existingAttempt) {
        // Return the existing attempt instead of creating a new one
        return existingAttempt;
      }
    } else {
      // Original logic for tests without allowResubmission
      // check if user has the last attempt which is in progress or submitted but not reviewed
      const lastAttempt = await this.attemptRepository.findOne({
        where: {
          testId,
          userId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
          status: In([AttemptStatus.IN_PROGRESS, AttemptStatus.SUBMITTED]),
          reviewStatus: ReviewStatus.PENDING,
        },
      });

      if (lastAttempt?.status === AttemptStatus.IN_PROGRESS) {
        throw new Error(
          'You have a incomplete attempt. Please complete it before starting a new attempt.'
        );
      }
      if (
        lastAttempt?.status === AttemptStatus.SUBMITTED &&
        lastAttempt?.reviewStatus === ReviewStatus.PENDING
      ) {
        throw new Error(
          'Your last attempt is currently under review. Please wait for the review to finish before starting a new one.'
        );
      }
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
      throw new Error(
        `Maximum attempts (${maxAttempts}) reached for this test. You cannot start a new attempt.`
      );
    }

    // Create attempt
    const attempt = this.attemptRepository.create({
      testId,
      userId,
      attempt: totalAttempts + 1,
      status: AttemptStatus.IN_PROGRESS,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    });

    const savedAttempt = await this.attemptRepository.save(attempt);

    // Generate questions based on test type
    if (test.type === TestType.RULE_BASED) {
      await this.generateRuleBasedTestQuestions(
        savedAttempt,
        test,
        authContext
      );
    }

    // Trigger plugin event
    await this.triggerPluginEvent(
      PluginManagerService.EVENTS.ATTEMPT_STARTED,
      authContext,
      {
        attemptId: savedAttempt.attemptId,
        testId: savedAttempt.testId,
        attemptNumber: savedAttempt.attempt,
      }
    );

    return savedAttempt;
  }

  /**
   * Retrieves a test attempt with user answers, and progress metrics.
   *
   * @param attemptId - The unique identifier of the attempt to retrieve
   * @param authContext - Authentication context containing user and organization details
   */
  async getAttemptAnswers(
    attemptId: string,
    userId: string,
    authContext: AuthContext
  ): Promise<any> {
    // Step 1: Validate and retrieve the attempt
    const attempt = await this.findAttemptById(attemptId, userId, authContext);
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Fetch user's answers for this attempt
    const userAnswers = await this.testUserAnswerRepository.find({
      where: {
        attemptId: attempt.attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      select: ['questionId', 'answer', 'updatedAt'],
      order: { createdAt: 'ASC' },
    });

    // Parse JSON answers and transform the response
    const parsedAnswers = userAnswers.map((ua) => {
      return {
        questionId: ua.questionId,
        answer: JSON.parse(ua.answer),
        updatedAt: ua.updatedAt,
      };
    });

    // update userattempt with updatedAt
    await this.attemptRepository.update(attempt.attemptId, {
      updatedAt: new Date(),
    });

    return {
      attempt: {
        attemptId: attempt.attemptId,
        testId: attempt.testId,
        userId: attempt.userId,
        attempt: attempt.attempt,
        startedAt: attempt.startedAt,
        currentPosition: attempt.currentPosition,
        timeSpent: attempt.timeSpent,
        updatedAt: attempt.updatedAt,
      },
      answers: parsedAnswers,
    };
  }

  // This methods is not used , it is used for resuming an in-progress test including hierarchy of questions and sections
  /**
   * Retrieves a test attempt with all associated data for resuming an in-progress test.
   * This method orchestrates the retrieval and transformation of attempt data including
   * test details, questions, user answers, and progress metrics.
   *
   * @param attemptId - The unique identifier of the attempt to retrieve
   * @param authContext - Authentication context containing user and organization details
   */
  async getAttempt_NotInUse(
    attemptId: string,
    userId: string,
    authContext: AuthContext
  ): Promise<any> {
    // Step 1: Validate and retrieve the attempt
    const attempt = await this.validateAndRetrieveAttempt(
      attemptId,
      userId,
      authContext
    );

    // Step 2: Fetch all related test and questions data
    const { test, testQuestions, questions, sections, userAnswers } =
      await this.fetchTestAndQuestionsData(attempt, authContext);

    // Step 3: Transform user answers into a lookup map for efficient access
    const answersMap = this.transformUserAnswers(userAnswers);

    // Step 4: Organize questions by sections and handle section structure
    const { sectionsWithQuestions } = this.organizeQuestionsBySections(
      testQuestions,
      questions,
      answersMap,
      sections
    );

    // Step 5: Calculate progress metrics (answered questions, percentage, current position)
    const progressMetrics = this.calculateProgressMetrics(
      questions,
      userAnswers,
      testQuestions,
      attempt
    );

    // Step 6: Build and return the complete response structure
    return this.buildAttemptResponse(
      attempt,
      test,
      sectionsWithQuestions,
      progressMetrics
    );
  }

  /**
   * Validates and retrieves a test attempt for the authenticated user.
   * Ensures the attempt exists, belongs to the user, and is in progress.
   * For tests with allowResubmission, allows access to submitted attempts.
   *
   * @param attemptId - The unique identifier of the attempt to validate
   * @param authContext - Authentication context for user and organization validation
   */
  private async validateAndRetrieveAttempt(
    attemptId: string,
    userId: string,
    authContext: AuthContext
  ): Promise<TestAttempt> {
    // Find attempt with proper ownership validation
    const attempt = await this.findAttemptById(attemptId, userId, authContext);

    // Validate attempt exists
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Get test information to check allowResubmission setting
    const testId = attempt.resolvedTestId || attempt.testId;
    const test = await this.findTestById(testId, authContext);

    // Ensure attempt is in progress - only in-progress attempts can be resumed
    // Exception: For tests with allowResubmission, allow access to submitted attempts
    if (
      attempt.status !== AttemptStatus.IN_PROGRESS &&
      !test.allowResubmission
    ) {
      throw new BadRequestException(
        'Cannot resume a submitted attempt. Use the result endpoint to view submitted attempt details.'
      );
    }

    return attempt;
  }

  /**
   * Fetches all test-related data including test details, questions, sections, and user answers.
   * This method performs multiple database queries to gather all necessary data for building
   * the complete attempt response.
   *
   * @param attempt - The validated test attempt entity
   * @param authContext - Authentication context for data access validation
   */
  private async fetchTestAndQuestionsData(
    attempt: TestAttempt,
    authContext: AuthContext
  ): Promise<{
    test: Test;
    testQuestions: TestQuestion[];
    questions: Question[];
    sections: TestSection[];
    userAnswers: TestUserAnswer[];
  }> {
    // Determine which test to use (resolved test for rule-based tests, original test otherwise)
    const testId = attempt.resolvedTestId || attempt.testId;

    // Fetch test details with proper ownership validation
    const test = await this.testRepository.findOne({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        status: Not(TestStatus.ARCHIVED),
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Fetch test questions with proper ordering for question sequence
    const testQuestions = await this.testQuestionRepository.find({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { ordering: 'ASC' },
    });

    // Extract question IDs and fetch complete question data with options
    const questionIds = testQuestions.map((tq) => tq.questionId);
    const questions = await this.questionRepository.find({
      where: {
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['options'], // Include question options for answer processing
      order: { ordering: 'ASC' },
    });

    // Fetch test sections for organizing questions (if any exist)
    const sections = await this.testSectionRepository.find({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { ordering: 'ASC' },
    });

    // Fetch user's answers for this attempt with chronological ordering
    const userAnswers = await this.testUserAnswerRepository.find({
      where: {
        attemptId: attempt.attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { createdAt: 'ASC' }, // Order by creation time for progress tracking
    });

    return { test, testQuestions, questions, sections, userAnswers };
  }

  /**
   * Transforms user answers from database entities into a lookup map for efficient access.
   * Parses JSON answer data and creates a structured map with question ID as key.
   *
   * @param userAnswers - Array of TestUserAnswer entities from database
   * @returns Map with questionId as key and structured answer data as value
   */
  private transformUserAnswers(
    userAnswers: TestUserAnswer[]
  ): Map<string, any> {
    const answersMap = new Map();

    // Process each user answer and create a lookup map
    userAnswers.forEach((ua) => {
      const answerData = JSON.parse(ua.answer);

      // Create structured answer object with all relevant metadata
      answersMap.set(ua.questionId, {
        questionId: ua.questionId,
        answer: answerData,
        score: ua.score,
        reviewStatus: ua.reviewStatus,
        remarks: ua.remarks,
        submittedAt: ua.createdAt,
        updatedAt: ua.updatedAt,
      });
    });

    return answersMap;
  }

  /**
   * Organizes questions by their assigned sections and transforms user answers.
   * Processes each test question, applies user answers, and groups them by section.
   * Questions without sections are collected separately.
   *
   * @param testQuestions - Array of test questions with ordering and section information
   * @param questions - Array of complete question entities with options
   * @param answersMap - Map of user answers keyed by question ID
   * @param sections - Array of test sections for organizing questions
   * @returns Object containing sections with questions and questions without sections
   */
  private organizeQuestionsBySections(
    testQuestions: TestQuestion[],
    questions: Question[],
    answersMap: Map<string, any>,
    sections: TestSection[]
  ): {
    sectionsWithQuestions: any[];
  } {
    // Maps to organize questions by section ID
    const questionsBySection = new Map();

    // Process each test question in order
    for (const testQuestion of testQuestions) {
      // Find the corresponding complete question entity
      const question = questions.find(
        (q) => q.questionId === testQuestion.questionId
      );
      if (!question) continue; // Skip if question not found

      // Get user's answer for this question and transform it
      const userAnswer = answersMap.get(question.questionId);
      const selectedOptions = this.transformUserAnswerForQuestion(
        userAnswer,
        question
      );

      // Build complete question data with user answers
      const questionData = this.buildQuestionData(
        question,
        testQuestion,
        selectedOptions
      );

      // Organize question by section or add to unsectioned questions
      if (testQuestion.sectionId) {
        // Initialize section array if it doesn't exist
        if (!questionsBySection.has(testQuestion.sectionId)) {
          questionsBySection.set(testQuestion.sectionId, []);
        }
        questionsBySection.get(testQuestion.sectionId).push(questionData);
      }
    }

    // Build the final sections structure with questions
    const sectionsWithQuestions = this.buildSectionsWithQuestions(
      questionsBySection,
      sections
    );

    return { sectionsWithQuestions };
  }

  /**
   * Transforms user answer data based on question type for display purposes.
   * Converts raw answer data into a structured format appropriate for each question type.
   * Handles different answer formats for MCQ, fill-in-blank, matching, and text questions.
   *
   * @param userAnswer - User's answer data with metadata
   * @param question - Question entity with type and options information
   * @returns Transformed answer data or null if no answer exists
   */
  private transformUserAnswerForQuestion(
    userAnswer: any,
    question: Question
  ): any {
    // Return null if no user answer exists
    if (!userAnswer || !userAnswer.answer) {
      return [];
    }

    const answerData = userAnswer.answer;

    // Transform answer based on question type
    switch (question.type) {
      case QuestionType.MCQ:
      case QuestionType.TRUE_FALSE:
      case QuestionType.MULTIPLE_ANSWER:
        // For multiple choice questions, return selected options with their text
        if (
          answerData.selectedOptionIds &&
          answerData.selectedOptionIds.length > 0
        ) {
          return (
            question.options
              ?.filter((opt) =>
                answerData.selectedOptionIds.includes(opt.questionOptionId)
              )
              .map((opt) => ({
                questionOptionId: opt.questionOptionId,
                text: opt.text,
              })) || []
          );
        }
        break;

      case QuestionType.FILL_BLANK:
        // For fill-in-blank questions, return blank answers with indices
        if (answerData.selectedOptionIds || answerData.blanks) {
          const fillBlankAnswers =
            answerData.selectedOptionIds || answerData.blanks;
          return fillBlankAnswers.map((blank: any) => {
            return {
              blankIndex: blank.blankIndex,
              text: blank.text || blank.answer || '',
            };
          });
        }
        break;

      case QuestionType.MATCH:
        // For matching questions, return matched pairs with option text and matched text
        if (answerData.matches) {
          return answerData.matches.map((match: any) => {
            const option = question.options?.find(
              (opt) => opt.questionOptionId === match.optionId
            );
            return {
              questionOptionId: match.optionId,
              text: option?.text || '', // User needs to see what they selected
              matchWith: match.matchWith, // The text they matched with
            };
          });
        }
        break;

      case QuestionType.SUBJECTIVE:
      case QuestionType.ESSAY:
        // For text-based questions, return the text content
        if (answerData.text) {
          return [
            {
              text: answerData.text,
            },
          ];
        }
        break;
    }

    return null;
  }

  /**
   * Builds a complete question data structure combining question details with user answers.
   * Creates a standardized question object for the frontend with all necessary information
   * while excluding sensitive data like correct answers and option scores.
   *
   * @param question - Complete question entity with options
   * @param testQuestion - Test question entity with ordering and section information
   * @param selectedOptions - Transformed user answer data for this question
   * @returns Complete question data object for frontend consumption
   */
  private buildQuestionData(
    question: Question,
    testQuestion: TestQuestion,
    selectedOptions: any
  ): any {
    return {
      // Basic question information
      questionId: question.questionId,
      text: question.text,
      description: question.description,
      type: question.type,
      level: question.level,
      marks: question.marks,
      idealTime: question.idealTime,
      gradingType: question.gradingType,
      allowPartialScoring: question.allowPartialScoring,
      params: question.params,
      media: question.media,

      // Test-specific question properties
      ordering: testQuestion.ordering,
      isCompulsory: testQuestion.isCompulsory,
      sectionId: testQuestion.sectionId,
      ruleId: testQuestion.ruleId,

      // Question options (excluding sensitive data for security)
      options:
        question.options?.map((opt) => ({
          questionOptionId: opt.questionOptionId,
          text: opt.text,
          media: opt.media,
          matchWith: opt.matchWith,
          matchWithMedia: opt.matchWithMedia,
          ordering: opt.ordering,
          blankIndex: opt.blankIndex,
          caseSensitive: opt.caseSensitive,
          // Don't include isCorrect and marks for security
        })) || [],

      // User's selected answers (if any)
      ...(selectedOptions && { selectedOptions }),
    };
  }

  /**
   * Builds the final sections structure with their associated questions.
   * Maps section entities to section objects containing questions organized by section ID.
   *
   * @param questionsBySection - Map of questions organized by section ID
   * @param sections - Array of test section entities
   * @returns Array of section objects with questions
   */
  private buildSectionsWithQuestions(
    questionsBySection: Map<string, any[]>,
    sections: TestSection[]
  ): any[] {
    return sections.map((section) => ({
      sectionId: section.sectionId,
      title: section.title,
      description: section.description,
      ordering: section.ordering,
      minQuestions: section.minQuestions,
      maxQuestions: section.maxQuestions,
      questions: questionsBySection.get(section.sectionId) || [], // Get questions for this section or empty array
    }));
  }

  /**
   * Calculates progress metrics for the test attempt including completion status and current position.
   * Determines how many questions have been answered, progress percentage, and the current question position
   * for resuming the test.
   *
   * @param questions - Array of all questions in the test
   * @param userAnswers - Array of user's submitted answers
   * @param testQuestions - Array of test questions with ordering information
   * @param attempt - Test attempt entity with current position
   * @returns Object containing progress metrics (total, answered, percentage, current position)
   */
  private calculateProgressMetrics(
    questions: Question[],
    userAnswers: TestUserAnswer[],
    testQuestions: TestQuestion[],
    attempt: TestAttempt
  ): {
    totalQuestions: number;
    answeredQuestions: number;
    progressPercentage: number;
    currentPosition: number;
  } {
    // Calculate basic progress metrics
    const totalQuestions = questions.length;
    const answeredQuestions = userAnswers.length;
    const progressPercentage =
      totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    // Determine the current question position for resuming the test
    let currentPosition = attempt.currentPosition;

    // If no current position is set, determine it based on user answers
    if (!currentPosition) {
      if (userAnswers.length > 0) {
        // Find the highest ordering value among answered questions
        const answeredQuestionOrderings = testQuestions
          .filter((tq) =>
            userAnswers.some((ua) => ua.questionId === tq.questionId)
          )
          .map((tq) => tq.ordering);

        if (answeredQuestionOrderings.length > 0) {
          // Find the highest ordering (last answered question)
          const maxOrdering = Math.max(...answeredQuestionOrderings);

          // Find the next question after the last answered one
          const nextQuestion = testQuestions.find(
            (tq) => tq.ordering > maxOrdering
          );
          currentPosition = nextQuestion ? nextQuestion.ordering : maxOrdering;
        } else {
          // No matching test questions found for user answers - start from beginning
          // This handles edge cases where user answers exist but don't match current test questions
          currentPosition = 1;
        }
      } else {
        // No answers yet - start from the first question
        currentPosition = 1;
      }
    }

    // Ensure currentPosition is never undefined, null, or less than 1
    // This prevents issues with invalid position values
    currentPosition = Math.max(1, currentPosition || 1);

    return {
      totalQuestions,
      answeredQuestions,
      progressPercentage,
      currentPosition,
    };
  }

  /**
   * Builds the complete response structure for the test attempt.
   * Combines test details, attempt information, progress metrics, and organized questions
   * into a comprehensive response object for the frontend.
   *
   * @param attempt - Test attempt entity with user and status information
   * @param test - Test entity with configuration and settings
   * @param sectionsWithQuestions - Array of sections with their questions
   * @param questionsWithoutSection - Array of questions not assigned to any section
   * @param progressMetrics - Calculated progress metrics (total, answered, percentage, position)
   * @returns Complete response object with all attempt data
   */
  private buildAttemptResponse(
    attempt: TestAttempt,
    test: Test,
    sectionsWithQuestions: any[],
    progressMetrics: any
  ) {
    return {
      // Test configuration and details
      testId: attempt.testId,
      resolvedTestId: attempt.resolvedTestId,
      title: test.title,
      description: test.description,
      totalMarks: test.totalMarks,
      timeDuration: test.timeDuration,
      showTime: test.showTime,
      type: test.type,
      passingMarks: test.passingMarks,

      // Test display settings
      showCorrectAnswer: test.showCorrectAnswer,
      showQuestionsOverview: test.showQuestionsOverview,
      questionsShuffle: test.questionsShuffle,
      answersShuffle: test.answersShuffle,
      paginationLimit: test.paginationLimit,
      showThankyouPage: test.showThankyouPage,
      showAllQuestions: test.showAllQuestions,
      answerSheet: test.answerSheet,
      printAnswersheet: test.printAnswersheet,

      // Attempt information with progress
      attempt: {
        attemptId: attempt.attemptId,
        userId: attempt.userId,
        attempt: attempt.attempt,
        status: attempt.status,
        reviewStatus: attempt.reviewStatus,
        submissionType: attempt.submissionType,
        result: attempt.result,
        score: attempt.score,
        currentPosition: progressMetrics.currentPosition,
        timeSpent: attempt.timeSpent,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,

        // Progress information
        progress: {
          totalQuestions: progressMetrics.totalQuestions,
          answeredQuestions: progressMetrics.answeredQuestions,
          progressPercentage: progressMetrics.progressPercentage,
          remainingQuestions:
            progressMetrics.totalQuestions - progressMetrics.answeredQuestions,
        },

        // Time remaining calculation
        timeRemaining: test.timeDuration
          ? Math.max(0, test.timeDuration - (attempt.timeSpent || 0))
          : null,
      },

      // Organized questions by sections
      sections: sectionsWithQuestions,
    };
  }

  async getAttemptQuestions(
    attemptId: string,
    userId: string,
    authContext: AuthContext
  ): Promise<Question[]> {
    const attempt = await this.findAttemptById(attemptId, userId, authContext);

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

    const questionIds = testQuestions.map((tq) => tq.questionId);

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

  /**
   * CLEANUP CHILD QUESTION ANSWERS BEFORE SUBMIT (WITH TRANSACTION)
   * Deletes all child question answers before processing new answers
   */
  private async cleanupChildQuestion(
    attemptId: string,
    existingAnswers: TestUserAnswer[],
    authContext: AuthContext,
    queryRunner: any
  ): Promise<void> {
    // Get all question IDs from existing answers
    const existingQuestionIds = existingAnswers.map((a) => a.questionId);

    // Get all questions to identify parent-child relationships using transaction
    const allQuestions = await queryRunner.manager.find(Question, {
      where: {
        questionId: In(existingQuestionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    // Identify child questions (questions with parentId != null)
    const childQuestions = allQuestions.filter((q) => q.parentId);

    if (childQuestions.length === 0) {
      return;
    }

    // Get all child question IDs
    const childQuestionIds = childQuestions.map((cq) => cq.questionId);

    // Delete ALL child question answers using transaction
    const deleteResult = await queryRunner.manager.delete(TestUserAnswer, {
      attemptId,
      questionId: In(childQuestionIds),
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    });
  }

  async submitAnswer(
    attemptId: string,
    submitAnswerDto: SubmitMultipleAnswersDto,
    authContext: AuthContext
  ): Promise<any> {
    // Handle the new format with answers array and optional global timeSpent
    const answersArray = submitAnswerDto.answers || [];
    const globalTimeSpent = submitAnswerDto.timeSpent || 0;

    if (answersArray.length === 0) {
      return { message: 'No answers provided to submit' };
    }

    // Use database transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verify attempt exists and belongs to user (only once)
      const attempt = await queryRunner.manager.findOne(TestAttempt, {
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

      const test = attempt.test;

      // Check if attempt is submitted (only for tests without allowResubmission)
      if (
        attempt.status === AttemptStatus.SUBMITTED &&
        !test.allowResubmission
      ) {
        throw new Error('Cannot submit answer to completed attempt');
      }

      // 2. Batch load all required data for optimal performance
      const questionIds = answersArray.map((answer) => answer.questionId);

      const [questions, allOptions, existingAnswers] = await Promise.all([
        queryRunner.manager.find(Question, {
          where: {
            questionId: In(questionIds),
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          },
        }),
        queryRunner.manager.find(QuestionOption, {
          where: { questionId: In(questionIds) },
          order: { questionId: 'ASC', ordering: 'ASC' },
        }),
        queryRunner.manager.find(TestUserAnswer, {
          where: {
            attemptId,
            questionId: In(questionIds),
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          },
        }),
      ]);

      // 3. Create lookup maps for efficient data access
      const questionMap = new Map(questions.map((q) => [q.questionId, q]));
      const existingAnswersMap = new Map(
        existingAnswers.map((a) => [a.questionId, a])
      );
      const optionsMap = new Map<string, QuestionOption[]>();

      allOptions.forEach((option) => {
        if (!optionsMap.has(option.questionId)) {
          optionsMap.set(option.questionId, []);
        }
        optionsMap.get(option.questionId)!.push(option);
      });

      // 4. Cleanup child questions if needed (using all existing answers for orphaned cleanup)
      const allExistingAnswers = await queryRunner.manager.find(
        TestUserAnswer,
        {
          where: {
            attemptId,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          },
        }
      );

      if (allExistingAnswers.length > 0) {
        await this.cleanupChildQuestion(
          attemptId,
          allExistingAnswers,
          authContext,
          queryRunner
        );
      }

      // 5. Process answers with transaction-safe scoring
      const answersToSave: TestUserAnswer[] = [];
      const answersToUpdate: TestUserAnswer[] = [];

      for (const answerDto of answersArray) {
        const question = questionMap.get(answerDto.questionId);
        if (!question) {
          throw new NotFoundException(`Question not found`);
        }

        const options = optionsMap.get(answerDto.questionId) || [];
        const existingAnswer = existingAnswersMap.get(answerDto.questionId);

        // Calculate score and review status based on question type
        let score = 0;
        let reviewStatus = AnswerReviewStatus.REVIEWED;

        // Only calculate score if test grading type is QUIZ or ASSESSMENT
        if (
          test.gradingType === GradingType.QUIZ ||
          test.gradingType === GradingType.ASSESSMENT
        ) {
          score = await this.calculateQuestionScore(
            answerDto.answer,
            question,
            options,
            queryRunner
          );
          reviewStatus = test.isObjective
            ? AnswerReviewStatus.REVIEWED
            : AnswerReviewStatus.PENDING;
        }

        // Improved score validation: check if score is a finite number and default to 0 if not
        const numericScore = Number(score);
        const finalScore =
          isNaN(numericScore) || !Number.isFinite(numericScore)
            ? 0
            : numericScore;

        if (existingAnswer) {
          existingAnswer.answer = JSON.stringify(answerDto.answer);
          existingAnswer.score = finalScore;
          existingAnswer.reviewStatus = reviewStatus;
          existingAnswer.updatedAt = new Date();
          answersToUpdate.push(existingAnswer);
        } else {
          const userAnswer = queryRunner.manager.create(TestUserAnswer, {
            attemptId,
            questionId: answerDto.questionId,
            answer: JSON.stringify(answerDto.answer),
            score: finalScore,
            reviewStatus: reviewStatus,
            anssOrder: '1',
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          });
          answersToSave.push(userAnswer);
        }
      }

      // 6. Batch save operations for optimal performance
      if (answersToSave.length > 0) {
        await queryRunner.manager.save(TestUserAnswer, answersToSave);
      }
      if (answersToUpdate.length > 0) {
        await queryRunner.manager.save(TestUserAnswer, answersToUpdate);
      }

      // 7. Update attempt time spent
      if (globalTimeSpent > 0) {
        attempt.timeSpent = (attempt.timeSpent || 0) + globalTimeSpent;
      }

      // 8. Update current position based on the last question's ordering
      if (answersArray.length > 0) {
        const testId = attempt.resolvedTestId || attempt.testId;
        const lastQuestionId = answersArray[answersArray.length - 1].questionId;
        const testQuestion = await queryRunner.manager.findOne(TestQuestion, {
          where: {
            testId,
            questionId: lastQuestionId,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          },
        });

        if (testQuestion) {
          attempt.currentPosition = testQuestion.ordering;
        }
      }

      await queryRunner.manager.save(attempt);

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { message: 'Answers submitted successfully' };
    } catch (error) {
      // Rollback the transaction on error
      await queryRunner.rollbackTransaction();
      console.error('Transaction rolled back due to error:', error);
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  /**
   * Validates that all compulsory questions for a test attempt have been answered.
   * Returns both validation status and detailed information about missing questions.
   *
   * @param attempt - The test attempt to validate
   * @param authContext - Authentication context for tenant/organization filtering
   * @returns Promise<{isValid: boolean, missingQuestions?: Array<{questionId: string, title: string, ordering: number, sectionId?: string}>}>
   */
  async validateCompulsoryQuestions(
    attempt: TestAttempt,
    authContext: AuthContext
  ): Promise<{
    isValid: boolean;
    missingQuestions?: Array<{
      questionId: string;
      title: string;
      ordering: number;
      sectionId?: string;
    }>;
  }> {
    const testId = attempt.resolvedTestId || attempt.testId;

    // Single optimized query: Get compulsory questions that are NOT answered by the user
    const missingCompulsoryQuestions = await this.testQuestionRepository
      .createQueryBuilder('tq')
      .leftJoin('questions', 'q', 'q.questionId = tq.questionId')
      .leftJoin(
        'testUserAnswers',
        'tua',
        'tua.questionId = tq.questionId AND tua.attemptId = :attemptId',
        { attemptId: attempt.attemptId }
      )
      .where('tq.testId = :testId', { testId })
      .andWhere('tq.isCompulsory = :isCompulsory', { isCompulsory: true })
      .andWhere('tq.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('tq.organisationId = :organisationId', {
        organisationId: authContext.organisationId,
      })
      .andWhere('q.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('q.organisationId = :organisationId', {
        organisationId: authContext.organisationId,
      })
      .andWhere('tua.questionId IS NULL') // This means no answer exists for this question
      .select([
        'tq.questionId',
        'tq.ordering',
        'tq.sectionId',
        'q.text as title',
      ])
      .orderBy('tq.ordering', 'ASC')
      .getRawMany();

    if (missingCompulsoryQuestions.length === 0) {
      // All compulsory questions are answered
      return { isValid: true };
    }

    // Transform the raw results to match the expected format
    const missingQuestions = missingCompulsoryQuestions.map((q) => ({
      questionId: q.tq_questionId,
      title: q.title,
      ordering: q.tq_ordering,
      sectionId: q.tq_sectionId,
    }));

    return {
      isValid: false,
      missingQuestions,
    };
  }

  /**
   * Submit an attempt and validate compulsory questions.
   *
   * @param attemptId - The ID of the test attempt to validate
   * @param authContext - Authentication context for tenant/organization filtering
   * @returns Promise<{isValid: boolean, missingQuestions?: Array<{questionId: string, title: string, ordering: number, sectionId?: string}>}>
   */
  async submitAttempt(
    attemptId: string,
    authContext: AuthContext
  ): Promise<any> {
    const attempt = await this.findAttemptById(
      attemptId,
      authContext.userId,
      authContext
    );

    // Get test information to check allowResubmission setting
    const testId = attempt.resolvedTestId || attempt.testId;
    const test = await this.findTestById(testId, authContext);

    // Check if attempt is already submitted (only for tests without allowResubmission)
    if (attempt.status === AttemptStatus.SUBMITTED && !test.allowResubmission) {
      throw new Error('Attempt is already submitted');
    }

    // Validate compulsory questions before allowing submission
    const compulsoryValidation = await this.validateCompulsoryQuestions(
      attempt,
      authContext
    );

    if (!compulsoryValidation.isValid) {
      throw new BadRequestException({
        message: `You need to answer all the required questions before submitting your attempt.`,
      });
    }

    // Get test information (already retrieved above)

    // Check if the test itself is a FEEDBACK type test
    if (
      attempt.test?.gradingType === GradingType.FEEDBACK ||
      attempt.test?.gradingType === GradingType.REFLECTION_PROMPT
    ) {
      // For feedback tests, set score to null and result to null (no pass/fail)
      attempt.score = null;
      attempt.result = null;
    } else {
      // Calculate sum of all answers score
      const totalAnswersScore = await this.calculateTotalAttemptScore(
        attemptId,
        authContext
      );
      attempt.score = totalAnswersScore;
      // check if the test have only objective questions that is question type is mcq or true_false, multiple_answer or match, fill_blank

      if (test.isObjective) {
        attempt.reviewStatus = ReviewStatus.REVIEWED;
        attempt.result =
          totalAnswersScore >= test.passingMarks
            ? ResultType.PASS
            : ResultType.FAIL;
        if (attempt.result === ResultType.PASS) {
          await this.updateLmsTestProgress(attempt, authContext);
        }
      } else {
        // Set review status to pending for manual review
        attempt.reviewStatus = ReviewStatus.PENDING;
      }
    }

    // Update attempt status
    attempt.status = AttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.submissionType = SubmissionType.SELF;

    const savedAttempt = await this.attemptRepository.save(attempt);

    // Trigger plugin event
    await this.triggerPluginEvent(
      PluginManagerService.EVENTS.ATTEMPT_SUBMITTED,
      authContext,
      {
        attemptId: savedAttempt.attemptId,
        testId: savedAttempt.testId,
        score: savedAttempt.score,
        result: savedAttempt.result,
        timeSpent: savedAttempt.timeSpent,
        reviewStatus: savedAttempt.reviewStatus,
        isObjective: test.isObjective,
      }
    );

    return {
      attemptId: savedAttempt.attemptId,
      score: savedAttempt.score,
      reviewStatus: savedAttempt.reviewStatus,
      result: savedAttempt.result,
      totalMarks: test.totalMarks,
    };
  }

  async reviewAttempt(
    attemptId: string,
    reviewDto: ReviewAttemptDto,
    authContext: AuthContext
  ): Promise<TestAttempt> {
    const attempt = await this.findAttemptById(
      attemptId,
      authContext.userId,
      authContext
    );

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Get test information for passing marks
    const testId = attempt.resolvedTestId || attempt.testId;
    const test = await this.testRepository.findOne({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        status: Not(TestStatus.ARCHIVED),
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Validate that the test has subjective questions
    if (test.isObjective) {
      throw new BadRequestException(
        'Objective tests do not require manual review'
      );
    }

    // Validate attempt status
    if (attempt.status !== AttemptStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted attempts can be reviewed');
    }

    // Get all answers for this attempt to validate
    const attemptAnswers = await this.testUserAnswerRepository
      .createQueryBuilder('answer')
      .innerJoin(
        'questions',
        'question',
        'question.questionId = answer.questionId'
      )
      .where('answer.attemptId = :attemptId', { attemptId })
      .andWhere('answer.tenantId = :tenantId', {
        tenantId: authContext.tenantId,
      })
      .andWhere('answer.organisationId = :organisationId', {
        organisationId: authContext.organisationId,
      })
      .andWhere('question.type IN (:...questionTypes)', {
        questionTypes: [QuestionType.SUBJECTIVE, QuestionType.ESSAY],
      })
      .getMany();

    // Update scores for reviewed answers
    for (const answerReview of reviewDto.answers) {
      // Score validation already done in the first loop above
      const validatedScore = Number(answerReview.score) || 0;

      await this.testUserAnswerRepository.update(
        {
          attemptId,
          questionId: answerReview.questionId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
        {
          score: validatedScore,
          remarks: answerReview.remarks,
          reviewedBy: authContext.userId,
          reviewStatus: AnswerReviewStatus.REVIEWED,
          reviewedAt: new Date(),
        }
      );
    }

    // Check if all pending subjective questions have been reviewed
    const pendingSubjectiveAnswers = attemptAnswers.filter((answer) => {
      return answer.reviewStatus != AnswerReviewStatus.REVIEWED;
    });

    // Determine attempt review status based on whether all questions are reviewed
    let attemptReviewStatus: ReviewStatus;
    if (pendingSubjectiveAnswers.length === 0) {
      // All subjective questions have been reviewed
      attemptReviewStatus = ReviewStatus.REVIEWED;
    } else {
      // Some questions still pending - mark as under review
      attemptReviewStatus = ReviewStatus.UNDER_REVIEW;
    }

    // Calculate final score by preserving existing auto-graded scores and adding reviewed scores
    const finalScore = await this.calculateTotalAttemptScore(
      attemptId,
      authContext
    );

    // Ensure final score is a proper number
    const validatedFinalScore = Number(finalScore) || 0;

    attempt.score = validatedFinalScore;
    attempt.reviewStatus = attemptReviewStatus;
    attempt.updatedBy = authContext.userId;

    // Only set result when attempt is fully reviewed
    if (attemptReviewStatus === ReviewStatus.REVIEWED) {
      attempt.result =
        validatedFinalScore >= test.passingMarks
          ? ResultType.PASS
          : ResultType.FAIL;
      
      // Call LMS service to update test progress when review is complete
      // This ensures LMS status is updated when marks change (both PASS and FAIL)
      // This handles the case where marks are updated and status needs to change
      await this.updateLmsTestProgress(attempt, authContext);
    }

    const savedAttempt = await this.attemptRepository.save(attempt);

    // Trigger plugin event
    await this.triggerPluginEvent(
      PluginManagerService.EVENTS.ATTEMPT_REVIEWED,
      authContext,
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
      .leftJoin(
        'testUserAnswers',
        'answers',
        'answers.attemptId = attempt.attemptId'
      )
      .leftJoin(
        'questions',
        'question',
        'question.questionId = answers.questionId'
      )
      .where('attempt.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('attempt.organisationId = :organisationId', {
        organisationId: authContext.organisationId,
      })
      .andWhere('attempt.reviewStatus IN (:...reviewStatuses)', {
        reviewStatuses: [ReviewStatus.PENDING, ReviewStatus.UNDER_REVIEW],
      })
      .andWhere('question.gradingType = :gradingType', {
        gradingType: GradingType.ASSESSMENT,
      })
      .andWhere('answers.reviewStatus = :answerReviewStatus', {
        answerReviewStatus: 'P',
      })
      .select([
        'attempt.attemptId',
        'attempt.testId',
        'attempt.userId',
        'attempt.submittedAt',
        'attempt.reviewStatus',
        'answers.questionId',
        'question.text as title',
        'question.type',
        'question.marks',
        'question.gradingType',
        'question.params',
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
  private async generateRuleBasedTestQuestions(
    attempt: TestAttempt,
    originalTest: Test,
    authContext: AuthContext
  ): Promise<void> {
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
      createdBy: authContext.userId,
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
          throw new Error(
            `Not enough pre-selected questions for rule ${rule.name}. Found ${availableQuestions.length}, required ${rule.numberOfQuestions}`
          );
        }

        // Select questions based on rule strategy
        const selectedQuestions = this.selectQuestionsFromRule(
          availableQuestions,
          rule.numberOfQuestions,
          rule.selectionStrategy
        );

        selectedQuestionIds = selectedQuestions.map((q) => q.questionId);
      } else {
        // Approach B: Dynamic selection based on criteria
        const questionIds = await this.questionPoolService.generateQuestionPool(
          rule.ruleId,
          authContext
        );

        if (questionIds.length < rule.numberOfQuestions) {
          throw new Error(
            `Not enough questions available for rule ${rule.name}. Found ${questionIds.length}, required ${rule.numberOfQuestions}`
          );
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
  private selectQuestionsFromPool(
    questionIds: string[],
    count: number,
    strategy: string
  ): string[] {
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
  private selectQuestionsFromRule(
    availableQuestions: TestQuestion[],
    count: number,
    strategy: string
  ): TestQuestion[] {
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
   * Calculates the total score from all answers for an attempt.
   *
   * This function uses a direct SQL query to sum all scores efficiently.
   *
   * @param attemptId - The ID of the test attempt to calculate total score for
   * @param authContext - Authentication context for tenant/organization filtering
   * @returns Promise<number> - The total score from all answers
   */
  private async calculateTotalAttemptScore(
    attemptId: string,
    authContext: AuthContext
  ): Promise<number> {
    const result = await this.testUserAnswerRepository
      .createQueryBuilder('answer')
      .select('COALESCE(SUM(answer.score), 0)', 'totalScore')
      .where('answer.attemptId = :attemptId', { attemptId })
      .andWhere('answer.tenantId = :tenantId', {
        tenantId: authContext.tenantId,
      })
      .andWhere('answer.organisationId = :organisationId', {
        organisationId: authContext.organisationId,
      })
      .getRawOne();

    return parseFloat(result?.totalScore || '0');
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
   * @param options - Pre-loaded question options (for transaction safety)
   * @param queryRunner - Optional query runner for transaction context
   * @returns number - The calculated score for this question
   */
  private async calculateQuestionScore(
    answerData: any,
    question: Question,
    options?: QuestionOption[],
    queryRunner?: any
  ): Promise<number> {
    // Get question options for validation - use provided options or fetch within transaction
    let questionOptions: QuestionOption[];
    if (options) {
      questionOptions = options;
    } else if (queryRunner) {
      questionOptions = await queryRunner.manager.find(QuestionOption, {
        where: { questionId: question.questionId },
        order: { ordering: 'ASC' },
      });
    } else {
      // Fallback to repository (not recommended for transaction contexts)
      questionOptions = await this.getQuestionOptions(question.questionId);
    }

    let score: number;

    switch (question.type) {
      case QuestionType.MCQ:
      case QuestionType.TRUE_FALSE:
        score = this.calculateMCQScore(answerData, question, questionOptions);
        break;

      case QuestionType.MULTIPLE_ANSWER:
        score = this.calculateMultipleAnswerScore(
          answerData,
          question,
          questionOptions
        );
        break;

      case QuestionType.FILL_BLANK:
        score = this.calculateFillBlankScore(
          answerData,
          question,
          questionOptions
        );
        break;

      case QuestionType.MATCH:
        score = this.calculateMatchScore(answerData, question, questionOptions);
        break;

      case QuestionType.SUBJECTIVE:
      case QuestionType.ESSAY:
        // Subjective questions are scored manually
        score = 0;
        break;

      case QuestionType.DROPDOWN:
        score = this.calculateMCQScore(answerData, question, questionOptions);
        break;

      case QuestionType.RATING:
        score = 0;
        break;

      default:
        score = 0;
    }

    // Ensure the score is always a valid number
    const numericScore = Number(score);
    return isNaN(numericScore) ? 0 : numericScore;
  }

  /**
   * Calculates score for MCQ and TRUE_FALSE questions.
   * Full marks if correct option selected, 0 otherwise.
   */
  private calculateMCQScore(
    answerData: any,
    question: Question,
    options: QuestionOption[]
  ): number {
    const selectedOptionIds = answerData.selectedOptionIds || [];

    // MCQ should have exactly one correct option
    const correctOption = options.find((opt) => opt.isCorrect);
    if (!correctOption) return 0;
    // Check if the selected option is correct
    const isCorrect =
      selectedOptionIds.length === 1 &&
      selectedOptionIds[0] === correctOption.questionOptionId;

    // Ensure question marks is a valid number
    const questionMarks = Number(question.marks);
    const safeQuestionMarks = isNaN(questionMarks) ? 0 : questionMarks;

    return isCorrect ? safeQuestionMarks : 0;
  }

  /**
   * Calculates score for MULTIPLE_ANSWER questions with partial scoring.
   * Supports both full marks for all correct or partial scoring per option.
   */
  private calculateMultipleAnswerScore(
    answerData: any,
    question: Question,
    options: QuestionOption[]
  ): number {
    const selectedOptionIds = answerData.selectedOptionIds || [];
    const correctOptions = options.filter((opt) => opt.isCorrect);

    if (correctOptions.length === 0) return 0;

    // Ensure question marks is a valid number
    const questionMarks = Number(question.marks);
    const safeQuestionMarks = isNaN(questionMarks) ? 0 : questionMarks;

    if (question.allowPartialScoring) {
      // For partial scoring: sum of marks for selected correct options
      let totalScore = 0;
      for (const correctOption of correctOptions) {
        if (selectedOptionIds.includes(correctOption.questionOptionId)) {
          const optionMarks = Number(correctOption.marks);
          totalScore += isNaN(optionMarks) ? 0 : optionMarks;
        }
      }
      return totalScore;
    } else {
      // For non-partial scoring: all-or-nothing based on question marks
      // Check if all correct options are selected and no incorrect options are selected
      const allCorrectSelected = correctOptions.every((opt) =>
        selectedOptionIds.includes(opt.questionOptionId)
      );
      const noIncorrectSelected = selectedOptionIds.every((selectedId) =>
        correctOptions.some((opt) => opt.questionOptionId === selectedId)
      );

      return allCorrectSelected && noIncorrectSelected ? safeQuestionMarks : 0;
    }
  }

  /**
   * Calculates score for FILL_BLANK questions.
   * Supports case sensitivity and exact matching with configurable partial scoring.
   */
  private calculateFillBlankScore(
    answerData: any,
    question: Question,
    options: QuestionOption[]
  ): number {
    const userBlanks = answerData.blanks || [];
    const correctOptions = options.filter((opt) => opt.isCorrect);

    if (correctOptions.length === 0 || userBlanks.length === 0) return 0;

    // Ensure question marks is a valid number
    const questionMarks = Number(question.marks);
    const safeQuestionMarks = isNaN(questionMarks) ? 0 : questionMarks;

    if (question.allowPartialScoring) {
      // For partial scoring: sum of marks for correct blanks using option marks
      let totalScore = 0;
      for (
        let i = 0;
        i < Math.min(userBlanks.length, correctOptions.length);
        i++
      ) {
        const userAnswer = userBlanks[i]?.trim();
        const correctAnswer = correctOptions[i]?.text?.trim();

        if (!userAnswer || !correctAnswer) continue;

        // Check case sensitivity
        const isCaseSensitive = correctOptions[i]?.caseSensitive || false;
        const isCorrect = isCaseSensitive
          ? userAnswer === correctAnswer
          : userAnswer.toLowerCase() === correctAnswer.toLowerCase();

        if (isCorrect) {
          const optionMarks = Number(correctOptions[i]?.marks || 0);
          totalScore += isNaN(optionMarks) ? 0 : optionMarks;
        }
      }
      return totalScore;
    } else {
      // For non-partial scoring: all-or-nothing based on question marks
      // Check if all blanks are correct
      let allCorrect = true;
      for (
        let i = 0;
        i < Math.min(userBlanks.length, correctOptions.length);
        i++
      ) {
        const userAnswer = userBlanks[i]?.trim();
        const correctAnswer = correctOptions[i]?.text?.trim();

        if (!userAnswer || !correctAnswer) {
          allCorrect = false;
          break;
        }

        // Check case sensitivity
        const isCaseSensitive = correctOptions[i]?.caseSensitive || false;
        const isCorrect = isCaseSensitive
          ? userAnswer === correctAnswer
          : userAnswer.toLowerCase() === correctAnswer.toLowerCase();

        if (!isCorrect) {
          allCorrect = false;
          break;
        }
      }

      return allCorrect ? safeQuestionMarks : 0;
    }
  }

  /**
   * Calculates score for MATCH questions.
   * Configurable partial scoring for each correct match.
   */
  private calculateMatchScore(
    answerData: any,
    question: Question,
    options: QuestionOption[]
  ): number {
    const userMatches = answerData.matches || [];
    const correctOptions = options.filter((opt) => opt.isCorrect);

    if (correctOptions.length === 0 || userMatches.length === 0) return 0;

    // Ensure question marks is a valid number
    const questionMarks = Number(question.marks);
    const safeQuestionMarks = isNaN(questionMarks) ? 0 : questionMarks;

    if (question.allowPartialScoring) {
      // For partial scoring: sum of marks for correct matches using option marks
      let totalScore = 0;
      for (const userMatch of userMatches) {
        // Find the correct option that matches this user selection
        const correctOption = correctOptions.find(
          (opt) =>
            opt.questionOptionId === userMatch.optionId &&
            opt.matchWith === userMatch.matchWith
        );
        if (correctOption) {
          const optionMarks = Number(correctOption.marks);
          totalScore += isNaN(optionMarks) ? 0 : optionMarks;
        }
      }
      return totalScore;
    } else {
      // For non-partial scoring: all-or-nothing based on question marks
      // Check if all matches are correct
      const allMatchesCorrect = correctOptions.every((correctOption) => {
        return userMatches.some(
          (userMatch) =>
            userMatch.optionId === correctOption.questionOptionId &&
            userMatch.matchWith === correctOption.matchWith
        );
      });

      return allMatchesCorrect ? safeQuestionMarks : 0;
    }
  }

  /**
   * Retrieves question options for scoring validation.
   */
  private async getQuestionOptions(
    questionId: string
  ): Promise<QuestionOption[]> {
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
  private async calculateFinalScore(
    attemptId: string,
    authContext: AuthContext
  ): Promise<number> {
    const { answers, totalMarks } = await this.getAttemptAnswersWithMarks(
      attemptId,
      authContext
    );

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
  private async getAttemptAnswersWithMarks(
    attemptId: string,
    authContext: AuthContext
  ): Promise<{ answers: TestUserAnswer[]; totalMarks: number }> {
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

  private async findAttemptById(
    attemptId: string,
    userId: string,
    authContext: AuthContext
  ): Promise<TestAttempt> {
    const attempt = await this.attemptRepository.findOne({
      where: {
        attemptId,
        userId: userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });
    console.log('attempt', attempt);
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return attempt;
  }

  private async findTestById(
    testId: string,
    authContext: AuthContext
  ): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        status: TestStatus.PUBLISHED,
      },
      relations: ['sections'],
      order: {
        sections: {
          ordering: 'ASC',
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    return test;
  }

  private async validateAttemptForAnswersheet(
    attemptId: string,
    authContext: AuthContext
  ): Promise<TestAttempt> {
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
      throw new BadRequestException(
        'Attempt results are only available for submitted attempts'
      );
    }

    return attempt;
  }

  /**
   * Generates the complete answersheet for a test attempt
   * @param attemptId - The ID of the attempt
   * @param authContext - Authentication context for tenant and organization validation
   * @returns Complete answersheet with test details, attempt info, and sections with questions
   */
  async getAttemptAnswersheet(
    attemptId: string,
    authContext: AuthContext
  ): Promise<any> {
    // Step 1: Validate attempt and its status
    const attempt = await this.validateAttemptForAnswersheet(
      attemptId,
      authContext
    );

    // Determine which test to use (resolved test for rule-based tests, original test otherwise)
    const testId = attempt.resolvedTestId || attempt.testId;

    // Step 2: Fetch test, user answers, and test questions in parallel for better performance
    const [test, userAnswers, testQuestions] = await Promise.all([
      this.testRepository.findOne({
        where: {
          testId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
      }),
      this.testUserAnswerRepository.find({
        where: {
          attemptId: attempt.attemptId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
      }),
      this.testQuestionRepository.find({
        where: {
          testId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
        order: { ordering: 'ASC' },
      }),
    ]);

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    if (!test.answerSheet) {
      throw new BadRequestException('Answer sheet is not enabled for this test');
    }

    // Create a map of question ordering for sorting answers
    const questionOrderMap = new Map(
      testQuestions.map((tq) => [tq.questionId, tq.ordering])
    );

    // ===== OLD CODE WITH N+1 QUERY PROBLEM (COMMENTED OUT) =====
    // This code had a critical performance issue: fetching questions one by one in a loop
    // If there are 50 answers, this would execute 50+ separate database queries
    /*
    const answers: Array<{
      questionId: string;
      userAnswer: any;
      score: number;
      isCorrect: boolean;
    }> = [];

    for (const userAnswer of userAnswers) {
      const question = await this.questionRepository.findOne({
        where: {
          questionId: userAnswer.questionId,
        },
        relations: ['options'],
      });

      if (!question) {
        continue; // Skip if question not found
      }

      const parsedAnswer = JSON.parse(userAnswer.answer);

      // Get correct answers if test.showCorrectAnswer is true
      let correctAnswers: string[] = [];
      let correctOptionMarks: number = 0;
      if (test.showCorrectAnswer && question.options) {
        correctAnswers = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.questionOptionId);

        // Calculate total marks for correct options (for partial scoring)
        correctOptionMarks = question.options
          .filter((opt) => opt.isCorrect)
          .reduce((sum, opt) => sum + (opt.marks || 0), 0);
      }

      // Transform selectedOptionIds into selectedOptions array with isCorrect property
      let selectedOptions: Array<{ optionId: string; isCorrect?: boolean }> =
        [];
      let selectedCorrectOptions: string[] = [];
      if (
        parsedAnswer.selectedOptionIds &&
        Array.isArray(parsedAnswer.selectedOptionIds)
      ) {
        selectedOptions = parsedAnswer.selectedOptionIds.map(
          (selectedId: string) => {
            const option: { optionId: string; isCorrect?: boolean } = {
              optionId: selectedId,
            };
            // Only add isCorrect if showCorrectAnswer is true
            if (test.showCorrectAnswer) {
              const isCorrect = correctAnswers.includes(selectedId);
              option.isCorrect = isCorrect;
              if (isCorrect) {
                selectedCorrectOptions.push(selectedId);
              }
            }
            return option;
          }
        );
      }

      // Calculate question-level isCorrect based on allowPartialScoring
      let questionIsCorrect = false;
      if (question.allowPartialScoring) {
        // For partial scoring: if any correct option is selected, question is correct
        questionIsCorrect = selectedCorrectOptions.length > 0;
      } else {
        // For non-partial scoring: user must select all correct options to get full marks
        // Check if all correct options are selected and no incorrect options are selected
        const allCorrectSelected = correctAnswers.every((correctId) =>
          parsedAnswer.selectedOptionIds?.includes(correctId)
        );
        const noIncorrectSelected =
          parsedAnswer.selectedOptionIds?.every((selectedId) =>
            correctAnswers.includes(selectedId)
          ) ?? true;
        questionIsCorrect = allCorrectSelected && noIncorrectSelected;
      }

      // Create the new userAnswer structure
      const transformedUserAnswer = {
        selectedOptions: selectedOptions,
      };

      answers.push({
        questionId: userAnswer.questionId,
        userAnswer: transformedUserAnswer,
        score: userAnswer.score,
        isCorrect: questionIsCorrect,
      });
    }
    */
    // ===== END OF OLD CODE =====

    // ===== OPTIMIZED CODE: BATCH LOAD QUESTIONS (FIXES N+1 QUERY PROBLEM) =====
    // Step 3: Extract all unique question IDs from user answers
    const questionIds = [
      ...new Set(userAnswers.map((ua) => ua.questionId)),
    ].filter((id) => id); // Remove any null/undefined values

    // Early return if no answers found
    if (questionIds.length === 0) {
      return {
        attempt: attempt,
        answers: [],
      };
    }

    // Step 4: Batch load all questions with their options using configurable batch size
    // This replaces N queries with batched queries, dramatically improving performance
    // Get batch size from config (default: 30)
    const batchSize =
      this.configService.get<number>('ANSWERSHEET_QUESTION_BATCH_SIZE') || 30;

    const questions: Question[] = [];
    // Process question IDs in batches to avoid query size limits
    for (let i = 0; i < questionIds.length; i += batchSize) {
      const batchIds = questionIds.slice(i, i + batchSize);
      const batchQuestions = await this.questionRepository.find({
        where: {
          questionId: In(batchIds),
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
        relations: ['options'],
      });
      questions.push(...batchQuestions);
    }

    // Step 5: Create a lookup map for O(1) access to questions by questionId
    const questionMap = new Map(
      questions.map((q) => [q.questionId, q])
    );

    // Step 6: Process user answers using the pre-loaded questions
    const answers: Array<{
      questionId: string;
      userAnswer: any;
      score: number;
      isCorrect: boolean;
      ordering?: number; // Add ordering for sorting
    }> = [];

    for (const userAnswer of userAnswers) {
      // Get question from the pre-loaded map (no database query needed)
      const question = questionMap.get(userAnswer.questionId);

      if (!question) {
        this.logger.warn(
          `Question ${userAnswer.questionId} not found for attempt ${attemptId}`
        );
        continue; // Skip if question not found
      }

      // Parse answer JSON with error handling
      let parsedAnswer: any;
      try {
        parsedAnswer = JSON.parse(userAnswer.answer);
      } catch (error) {
        this.logger.error(
          `Failed to parse answer JSON for question ${userAnswer.questionId} in attempt ${attemptId}`,
          error
        );
        // Continue with empty answer structure
        parsedAnswer = {};
      }

      // Handle different question types
      let transformedUserAnswer: any = {};
      let questionIsCorrect = false;

      // Check if this is a subjective/essay question (has text answer)
      if (
        (question.type === QuestionType.SUBJECTIVE ||
          question.type === QuestionType.ESSAY) &&
        parsedAnswer.text
      ) {
        // Handle subjective/essay questions
        transformedUserAnswer = {
          text: parsedAnswer.text,
        };
        // For subjective questions, isCorrect is based on score (if scored, consider it correct)
        // You can adjust this logic based on your requirements
        questionIsCorrect = userAnswer.score > 0;
      } else if (
        question.type === QuestionType.FILL_BLANK &&
        (parsedAnswer.blanks || parsedAnswer.selectedOptionIds)
      ) {
        // Handle fill-in-blank questions
        const blanks = parsedAnswer.blanks || parsedAnswer.selectedOptionIds || [];
        transformedUserAnswer = {
          blanks: blanks.map((blank: any, index: number) => ({
            blankIndex: blank.blankIndex ?? index,
            text: blank.text || blank.answer || blank || '',
          })),
        };
        // For fill-blank, isCorrect is based on score
        questionIsCorrect = userAnswer.score > 0;
      } else if (
        question.type === QuestionType.MATCH &&
        parsedAnswer.matches
      ) {
        // Handle matching questions
        transformedUserAnswer = {
          matches: parsedAnswer.matches.map((match: any) => {
            const option = question.options?.find(
              (opt) => opt.questionOptionId === match.optionId
            );
            return {
              questionOptionId: match.optionId,
              text: option?.text || '',
              matchWith: match.matchWith || '',
            };
          }),
        };
        // For match, isCorrect is based on score
        questionIsCorrect = userAnswer.score > 0;
      } else {
        // Handle objective questions (MCQ, Multiple Answer, True/False, Dropdown, etc.)
        // Get correct answers if test.showCorrectAnswer is true
        let correctAnswers: string[] = [];
        let correctOptionMarks: number = 0;
        if (test.showCorrectAnswer && question.options) {
          correctAnswers = question.options
            .filter((opt) => opt.isCorrect)
            .map((opt) => opt.questionOptionId);

          // Calculate total marks for correct options (for partial scoring)
          correctOptionMarks = question.options
            .filter((opt) => opt.isCorrect)
            .reduce((sum, opt) => sum + (opt.marks || 0), 0);
        }

        // Transform selectedOptionIds into selectedOptions array with isCorrect property
        let selectedOptions: Array<{ optionId: string; isCorrect?: boolean }> =
          [];
        let selectedCorrectOptions: string[] = [];
        if (
          parsedAnswer.selectedOptionIds &&
          Array.isArray(parsedAnswer.selectedOptionIds)
        ) {
          selectedOptions = parsedAnswer.selectedOptionIds.map(
            (selectedId: string) => {
              const option: { optionId: string; isCorrect?: boolean } = {
                optionId: selectedId,
              };
              // Only add isCorrect if showCorrectAnswer is true
              if (test.showCorrectAnswer) {
                const isCorrect = correctAnswers.includes(selectedId);
                option.isCorrect = isCorrect;
                if (isCorrect) {
                  selectedCorrectOptions.push(selectedId);
                }
              }
              return option;
            }
          );
        }

        // Calculate question-level isCorrect based on allowPartialScoring
        if (question.allowPartialScoring) {
          // For partial scoring: if any correct option is selected, question is correct
          questionIsCorrect = selectedCorrectOptions.length > 0;
        } else {
          // For non-partial scoring: user must select all correct options to get full marks
          // Check if all correct options are selected and no incorrect options are selected
          const allCorrectSelected = correctAnswers.every((correctId) =>
            parsedAnswer.selectedOptionIds?.includes(correctId)
          );
          const noIncorrectSelected =
            parsedAnswer.selectedOptionIds?.every((selectedId) =>
              correctAnswers.includes(selectedId)
            ) ?? true;
          questionIsCorrect = allCorrectSelected && noIncorrectSelected;
        }

        // Create the userAnswer structure for objective questions
        transformedUserAnswer = {
          selectedOptions: selectedOptions,
        };
      }

      // Get ordering from test questions map (default to 9999 if not found for sorting)
      const ordering = questionOrderMap.get(userAnswer.questionId) ?? 9999;

      answers.push({
        questionId: userAnswer.questionId,
        userAnswer: transformedUserAnswer,
        score: userAnswer.score,
        isCorrect: questionIsCorrect,
        ordering: ordering,
      });
    }

    // Step 7: Sort answers by test question ordering to maintain test sequence
    answers.sort((a, b) => (a.ordering || 9999) - (b.ordering || 9999));

    // Remove ordering from final response (it was only for sorting)
    const finalAnswers = answers.map(({ ordering, ...answer }) => answer);

    // ===== END OF OPTIMIZED CODE =====

    // Step 8: Build the complete answersheet structure
    const answersheet = {
      attempt: attempt,
      answers: finalAnswers,
    };

    return answersheet;
  }

  async reviewTestAttempt(
    testId: string,
    reviewDto: ReviewTestAttemptDto,
    authContext: AuthContext
  ): Promise<TestAttempt> {
    // Get test information
    const test = await this.testRepository.findOne({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        status: Not(TestStatus.ARCHIVED),
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Find the attempt based on allowResubmission and gradingType logic
    let attempt: TestAttempt | null = null;

    if (test.allowResubmission) {
      // For tests with allowResubmission, find the existing attempt
      attempt = await this.attemptRepository.findOne({
        where: {
          testId,
          userId: reviewDto.userId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
        order: { attempt: 'DESC' }, // Get the most recent attempt
      });
    } else {
      // For tests without allowResubmission, find the most recent submitted attempt
      attempt = await this.attemptRepository.findOne({
        where: {
          testId,
          userId: reviewDto.userId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
          status: AttemptStatus.SUBMITTED,
        },
        order: { attempt: 'DESC' }, // Get the most recent attempt
      });
    }

    if (!attempt) {
      throw new NotFoundException('No attempt found for review');
    }

    // Validate attempt status - should be submitted for review
    if (attempt.status !== AttemptStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted attempts can be reviewed');
    }

    // Get all answers for this attempt to validate and update
    const attemptAnswers = await this.testUserAnswerRepository
      .createQueryBuilder('answer')
      .innerJoin(
        'questions',
        'question',
        'question.questionId = answer.questionId'
      )
      .where('answer.attemptId = :attemptId', { attemptId: attempt.attemptId })
      .andWhere('answer.tenantId = :tenantId', {
        tenantId: authContext.tenantId,
      })
      .andWhere('answer.organisationId = :organisationId', {
        organisationId: authContext.organisationId,
      })
      .getMany();

    // Update scores for reviewed answers
    for (const answerReview of reviewDto.answers) {
      const existingAnswer = attemptAnswers.find(
        (answer) => answer.questionId === answerReview.questionId
      );

      if (existingAnswer) {
        // Update the answer with review score
        existingAnswer.score = Number(answerReview.score) || 0;
        existingAnswer.reviewStatus = AnswerReviewStatus.REVIEWED;
        existingAnswer.reviewedAt = new Date();
        existingAnswer.reviewedBy = authContext.userId;

        if (answerReview.remarks) {
          existingAnswer.remarks = answerReview.remarks;
        }

        await this.testUserAnswerRepository.save(existingAnswer);
      } else {
        throw new NotFoundException('User answers not found');
      }
    }

    const totalScore = await this.calculateTotalAttemptScore(
      attempt.attemptId,
      authContext
    );

    // Determine result based on passing marks
    const result =
      totalScore >= test.passingMarks ? ResultType.PASS : ResultType.FAIL;

    // Update attempt with new score and result
    attempt.score = Number(totalScore) || 0;
    attempt.result = result;
    attempt.reviewStatus = ReviewStatus.REVIEWED;
    attempt.updatedBy = authContext.userId;

    // Call LMS service to update test progress for both PASS and FAIL
    // This ensures LMS status is updated when marks change (both PASS and FAIL)
    // This handles the case where marks are updated via assessment import and status needs to change
    const lmsUpdateSuccess = await this.updateLmsTestProgress(
      attempt,
      authContext
    );

    if (!lmsUpdateSuccess) {
      this.logger.error(
        `Failed to update LMS service for attempt ${attempt.attemptId}, rolling back attempt update`
      );
      throw new BadRequestException(
        'Failed to update test progress in LMS service. Please try again.'
      );
    }

    // Save attempt locally only after successful LMS update
    const savedAttempt = await this.attemptRepository.save(attempt);

    return savedAttempt;
  }

  /**
   * Updates test progress in the LMS service
   * @param attempt - The test attempt to update
   * @param authContext - Authentication context
   * @returns Promise<boolean> - Success status
   */
  private async updateLmsTestProgress(
    attempt: TestAttempt,
    authContext: AuthContext
  ): Promise<boolean> {
    try {
      const lmsServiceUrl = this.configService.get<string>('LMS_SERVICE_URL');

      if (!lmsServiceUrl) {
        this.logger.warn('LMS_SERVICE_URL not configured, skipping LMS update');
        return true; // Return true to not block the process if LMS is not configured
      }

      const payload = {
        testId: attempt.testId,
        userId: attempt.userId,
        score: attempt.score,
        result: attempt.result,
        reviewedBy: authContext.userId,
      };

      this.logger.log(
        `Updating LMS test progress for attempt ${attempt.attemptId}`,
        {
          attemptId: attempt.attemptId,
          testId: attempt.testId,
          userId: attempt.userId,
          score: attempt.score,
          result: attempt.result,
        }
      );

      const response = await axios.patch(
        lmsServiceUrl + '/course/tracking/update_test_progress',
        payload,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          },
        }
      );

      // Check both HTTP status and API response status
      if (response.status >= 200 && response.status < 300) {
        const responseData = response.data;

        // Validate API response structure
        if (
          responseData &&
          responseData.params &&
          responseData.params.status === 'successful'
        ) {
          this.logger.log(
            `Successfully updated LMS test progress for attempt ${attempt.attemptId}`,
            {
              attemptId: attempt.attemptId,
              lessonTrackId: responseData.result?.lessonTrackId,
              score: responseData.result?.score,
              status: responseData.result?.status,
              completionPercentage: responseData.result?.completionPercentage,
            }
          );
          return true;
        } else {
          this.logger.error(`LMS API returned unsuccessful status`, {
            attemptId: attempt.attemptId,
            apiStatus: responseData.params?.status,
            errorMessage: responseData.params?.errmsg,
            responseCode: responseData.responseCode,
          });
          return false;
        }
      } else {
        this.logger.error(
          `LMS service returned HTTP error status: ${response.status}`,
          {
            attemptId: attempt.attemptId,
            status: response.status,
            response: response.data,
          }
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Failed to update LMS test progress for attempt ${attempt.attemptId}`,
        {
          attemptId: attempt.attemptId,
          error: error.message,
          stack: error.stack,
        }
      );
      return false;
    }
  }

  private async triggerPluginEvent(
    eventName: string,
    authContext: AuthContext,
    eventData: any
  ): Promise<void> {
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
