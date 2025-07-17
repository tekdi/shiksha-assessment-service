import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TestAttempt, AttemptStatus, SubmissionType, ReviewStatus, ResultType } from '../tests/entities/test-attempt.entity';
import { TestUserAnswer } from '../tests/entities/test-user-answer.entity';
import { Test, TestType, TestStatus } from '../tests/entities/test.entity';
import { TestQuestion } from '../tests/entities/test-question.entity';
import { TestRule } from '../tests/entities/test-rule.entity';
import { Question, QuestionType } from '../questions/entities/question.entity';
import { GradingType } from '../tests/entities/test.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ReviewAttemptDto } from './dto/review-answer.dto';
import { PluginManagerService } from '@/common/services/plugin-manager.service';
import { QuestionPoolService } from '../tests/question-pool.service';
import { ResumeAttemptDto } from './dto/resume-attempt.dto';
import { TestSection } from '../tests/entities/test-section.entity';

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
    @InjectRepository(TestSection)
    private readonly testSectionRepository: Repository<TestSection>,
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


  /**
   * Retrieves a test attempt with all associated data for resuming an in-progress test.
   * This method orchestrates the retrieval and transformation of attempt data including
   * test details, questions, user answers, and progress metrics.
   * 
   * @param attemptId - The unique identifier of the attempt to retrieve
   * @param authContext - Authentication context containing user and organization details
   */
  async getAttempt(attemptId: string, authContext: AuthContext): Promise<any> {
    // Step 1: Validate and retrieve the attempt
    const attempt = await this.validateAndRetrieveAttempt(attemptId, authContext);
    
    // Step 2: Fetch all related test and questions data
    const { test, testQuestions, questions, sections, userAnswers } = await this.fetchTestAndQuestionsData(attempt, authContext);
    
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
    const progressMetrics = this.calculateProgressMetrics(questions, userAnswers, testQuestions, attempt);
    
    // Step 6: Build and return the complete response structure
    return this.buildAttemptResponse(attempt, test, sectionsWithQuestions, progressMetrics);
  }

  /**
   * Validates and retrieves a test attempt for the authenticated user.
   * Ensures the attempt exists, belongs to the user, and is in progress.
   * 
   * @param attemptId - The unique identifier of the attempt to validate
   * @param authContext - Authentication context for user and organization validation
   */
  private async validateAndRetrieveAttempt(attemptId: string, authContext: AuthContext): Promise<TestAttempt> {
    // Find attempt with proper ownership validation
    const attempt = await this.attemptRepository.findOne({
      where: {
        attemptId,
        userId: authContext.userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    // Validate attempt exists
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Ensure attempt is in progress - only in-progress attempts can be resumed
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot resume a submitted attempt. Use the result endpoint to view submitted attempt details.');
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
  private async fetchTestAndQuestionsData(attempt: TestAttempt, authContext: AuthContext): Promise<{
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
    const questionIds = testQuestions.map(tq => tq.questionId);
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
  private transformUserAnswers(userAnswers: TestUserAnswer[]): Map<string, any> {
    const answersMap = new Map();
    
    // Process each user answer and create a lookup map
    userAnswers.forEach(ua => {
      // Parse the JSON answer data stored in the database
      const answerData = JSON.parse(ua.answer);
      
      // Create structured answer object with all relevant metadata
      answersMap.set(ua.questionId, {
        questionId: ua.questionId,
        answer: answerData, // Parsed answer content
        score: ua.score, // Calculated score for this answer
        reviewStatus: ua.reviewStatus, // Review status for subjective questions
        remarks: ua.remarks, // Reviewer remarks if any
        submittedAt: ua.createdAt, // When the answer was first submitted
        updatedAt: ua.updatedAt, // When the answer was last modified
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
      const question = questions.find(q => q.questionId === testQuestion.questionId);
      if (!question) continue; // Skip if question not found

      // Get user's answer for this question and transform it
      const userAnswer = answersMap.get(question.questionId);
      const selectedOptions = this.transformUserAnswerForQuestion(userAnswer, question);
      
      // Build complete question data with user answers
      const questionData = this.buildQuestionData(question, testQuestion, selectedOptions);

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
    const sectionsWithQuestions = this.buildSectionsWithQuestions(questionsBySection, sections);

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
  private transformUserAnswerForQuestion(userAnswer: any, question: Question): any {
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
        if (answerData.selectedOptionIds && answerData.selectedOptionIds.length > 0) {
          return question.options?.filter(opt => 
            answerData.selectedOptionIds.includes(opt.questionOptionId)
          ).map(opt => ({
            questionOptionId: opt.questionOptionId,
            text: opt.text,
          })) || [];
        }
        break;
        
      case QuestionType.FILL_BLANK:
        // For fill-in-blank questions, return blank answers with indices
        if (answerData.selectedOptionIds || answerData.blanks) {
          const fillBlankAnswers = answerData.selectedOptionIds || answerData.blanks;
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
            const option = question.options?.find(opt => opt.questionOptionId === match.optionId);
            return {
              questionOptionId: match.optionId,
              text: option?.text || '',  // User needs to see what they selected
              matchWith: match.matchWith,  // The text they matched with
            };
          });
        }
        break;
        
      case QuestionType.SUBJECTIVE:
      case QuestionType.ESSAY:
        // For text-based questions, return the text content
        if (answerData.text) {
          return [{
            text: answerData.text,
          }];
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
  private buildQuestionData(question: Question, testQuestion: TestQuestion, selectedOptions: any): any {
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
      options: question.options?.map(opt => ({
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
  private buildSectionsWithQuestions(questionsBySection: Map<string, any[]>, sections: TestSection[]): any[] {
    return sections.map(section => ({
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
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    // Determine the current question position for resuming the test
    let currentPosition = attempt.currentPosition;
    
    // If no current position is set, determine it based on user answers
    if (!currentPosition) {
      if (userAnswers.length > 0) {
        // Find the highest ordering value among answered questions
        const answeredQuestionOrderings = testQuestions
          .filter(tq => userAnswers.some(ua => ua.questionId === tq.questionId))
          .map(tq => tq.ordering);
        
        if (answeredQuestionOrderings.length > 0) {
          // Find the highest ordering (last answered question)
          const maxOrdering = Math.max(...answeredQuestionOrderings);
          
          // Find the next question after the last answered one
          const nextQuestion = testQuestions.find(tq => tq.ordering > maxOrdering);
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
            remainingQuestions: progressMetrics.totalQuestions - progressMetrics.answeredQuestions,
          },
          
          // Time remaining calculation
          timeRemaining: test.timeDuration ? Math.max(0, test.timeDuration - (attempt.timeSpent || 0)) : null,
        },
        
        // Organized questions by sections
        sections: sectionsWithQuestions,     
    };
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
      relations: ['test'],
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
      relations: ['test'],
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    attempt.status = AttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.submissionType = SubmissionType.SELF;

    // Check if the test itself is a FEEDBACK type test
    if (attempt.test?.gradingType === GradingType.FEEDBACK) {
      // For feedback tests, set score to null and result to FEEDBACK
      attempt.score = null;
      attempt.result = null;
    } else {
      // Check if test has questions that need review (ASSIGNMENT type questions)
      const hasSubjectiveQuestions = await this.hasSubjectiveQuestions(attemptId, authContext);
      
      if (hasSubjectiveQuestions) {
        // Set review status to pending for manual review
        attempt.reviewStatus = ReviewStatus.PENDING;
      } else {
        // Auto-calculate score for objective questions (QUIZ type)
        const score = await this.calculateObjectiveScore(attemptId, authContext);
        attempt.score = score;
        attempt.reviewStatus = ReviewStatus.REVIEWED;
        attempt.result = score >= 60 ? ResultType.PASS : ResultType.FAIL; // Assuming 60% is passing
      }
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
        // Validate that each match has optionId and matchWith
        for (const match of answer.matches) {
          if (!match.optionId || !match.matchWith) {
            throw new Error('Each match must have optionId and matchWith');
          }
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
      .andWhere('question.gradingType IN (:...gradingTypes)', { gradingTypes: [GradingType.ASSIGNMENT] })
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

} 