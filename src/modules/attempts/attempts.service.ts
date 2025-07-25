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
    // check if user has the last attempt which is in progress or submitted but not reviewed
    const lastAttempt = await this.attemptRepository.findOne({
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId, 
        status: In([AttemptStatus.IN_PROGRESS, AttemptStatus.SUBMITTED]),
        reviewStatus: ReviewStatus.PENDING
      },
    });

    if (lastAttempt?.status === AttemptStatus.IN_PROGRESS) {
      throw new Error('You have a incomplete attempt. Please complete it before starting a new attempt.');
    }
    if (lastAttempt?.status === AttemptStatus.SUBMITTED && lastAttempt?.reviewStatus === ReviewStatus.PENDING) {
      throw new Error('Your last attempt is currently under review. Please wait for the review to finish before starting a new one.');
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

    /**
   * Retrieves a test attempt with user answers, and progress metrics.
   * 
   * @param attemptId - The unique identifier of the attempt to retrieve
   * @param authContext - Authentication context containing user and organization details
   */
    async getAttemptAnswers(attemptId: string, authContext: AuthContext): Promise<any> {
      // Step 1: Validate and retrieve the attempt
      const attempt = await this.findAttemptById(attemptId, authContext);
      if(!attempt){
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

    // update userattempt with updatedAt
    await this.attemptRepository.update(attempt.attemptId, { updatedAt: new Date() });

    return { 
      attempt : {
        attemptId: attempt.attemptId,
        testId: attempt.testId,
        userId: attempt.userId,
        attempt: attempt.attempt,
        startedAt: attempt.startedAt,
        currentPosition: attempt.currentPosition,
        timeSpent: attempt.timeSpent,
        updatedAt: attempt.updatedAt
      },
      answers: userAnswers,
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
  async getAttempt_NotInUse(attemptId: string, authContext: AuthContext): Promise<any> {
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
    const attempt = await this.findAttemptById(attemptId, authContext);

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

  async submitAnswer(attemptId: string, submitAnswerDto: SubmitAnswerDto[], authContext: AuthContext): Promise<void> {
    // Convert single answer to array for unified processing
    const answersArray = Array.isArray(submitAnswerDto) ? submitAnswerDto : [submitAnswerDto];
    
    if (answersArray.length === 0) {
      throw new NotFoundException('No answers provided');
    }

    // Verify attempt exists and belongs to user (only once)
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

    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new Error('Cannot submit answer to completed attempt');
    }

    // Get all questions to validate answer formats and determine question types (batch query)
    const questionIds = answersArray.map(answer => answer.questionId);
    const questions = await this.questionRepository.find({
      where: {
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['options'], // Load options for scoring
    });

    if (questions.length !== questionIds.length) {
      const foundQuestionIds = questions.map(q => q.questionId);
      const missingQuestionIds = questionIds.filter(id => !foundQuestionIds.includes(id));
      throw new NotFoundException(`Questions not found: ${missingQuestionIds.join(', ')}`);
    }

    const questionMap = new Map(questions.map(q => [q.questionId, q]));

    // Get existing answers for this attempt (batch query)
    const existingAnswers = await this.testUserAnswerRepository.find({
      where: {
        attemptId,
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    const existingAnswersMap = new Map(existingAnswers.map(a => [a.questionId, a]));

    // Prepare answers to save/update
    const answersToSave = [];
    const answersToUpdate = [];
    let totalTimeSpent = 0;

    for (const answerDto of answersArray) {
      const answer = JSON.stringify(answerDto.answer);
      const question = questionMap.get(answerDto.questionId);
      const existingAnswer = existingAnswersMap.get(answerDto.questionId);

      // Add null check for question object before calculating score
      if (!question) {
        throw new NotFoundException(`Question not found`);
      }

      // Calculate score and review status based on question type
      let score = await this.calculateQuestionScore(answerDto.answer, question);
      let reviewStatus = AnswerReviewStatus.PENDING;
      if (attempt.test.isObjective) {
        reviewStatus = AnswerReviewStatus.REVIEWED
      } 

      // Improved score validation: check if score is a finite number and default to 0 if not
      const numericScore = Number(score);
      const finalScore = (isNaN(numericScore) || !Number.isFinite(numericScore)) ? 0 : numericScore;

      if (existingAnswer) {
        existingAnswer.answer = answer;
        existingAnswer.score = finalScore;
        existingAnswer.reviewStatus = reviewStatus;
        existingAnswer.updatedAt = new Date();
        answersToUpdate.push(existingAnswer);
      } else {
        const userAnswer = this.testUserAnswerRepository.create({
          attemptId,
          questionId: answerDto.questionId,
          answer: answer,
          score: finalScore,
          reviewStatus: reviewStatus,
          anssOrder: '1', // This could be enhanced to track order
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        });
        answersToSave.push(userAnswer);
      }

      // Accumulate time spent
      if (answerDto.timeSpent) {
        totalTimeSpent += answerDto.timeSpent;
      }
    }

    // Save all answers in batch operations
    if (answersToSave.length > 0) {
      await this.testUserAnswerRepository.save(answersToSave);
    }
    if (answersToUpdate.length > 0) {
      await this.testUserAnswerRepository.save(answersToUpdate);
    }

    // Update attempt time spent
    if (totalTimeSpent > 0) {
      attempt.timeSpent = (attempt.timeSpent || 0) + totalTimeSpent;
    }

    // Update current position based on the last question's ordering
    if (answersArray.length > 0) {
      const testId = attempt.resolvedTestId || attempt.testId;
      const lastQuestionId = answersArray[answersArray.length - 1].questionId;
      const testQuestion = await this.testQuestionRepository.findOne({
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

    await this.attemptRepository.save(attempt);

  }

  async submitAttempt(attemptId: string, authContext: AuthContext): Promise<TestAttempt & { totalMarks: number }> {
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
      
      // Calculate sum of all answers score
      const totalAnswersScore = await this.calculateTotalAttemptScore(attemptId, authContext);
      attempt.score = totalAnswersScore;
      if (test.isObjective) {
        attempt.reviewStatus = ReviewStatus.REVIEWED;
        attempt.result = totalAnswersScore >= test.passingMarks ? ResultType.PASS : ResultType.FAIL;
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
    await this.triggerPluginEvent(PluginManagerService.EVENTS.ATTEMPT_SUBMITTED, authContext, {
      attemptId: savedAttempt.attemptId,
      testId: savedAttempt.testId,
      score: savedAttempt.score,
      result: savedAttempt.result,
      timeSpent: savedAttempt.timeSpent,
      reviewStatus: savedAttempt.reviewStatus,
      isObjective: test.isObjective,
    });

    return { ...savedAttempt, totalMarks: test.totalMarks };
  }

  async reviewAttempt(attemptId: string, reviewDto: ReviewAttemptDto, authContext: AuthContext): Promise<TestAttempt> {
    const attempt = await this.findAttemptById(attemptId, authContext);

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
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Validate that the test has subjective questions
    if (test.isObjective) {
      throw new BadRequestException('Objective tests do not require manual review');
    }
    
    // Validate attempt status
    if (attempt.status !== AttemptStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted attempts can be reviewed');
    }

    // Get all answers for this attempt to validate
    const attemptAnswers = await this.testUserAnswerRepository
      .createQueryBuilder('answer')
      .innerJoin('questions', 'question', 'question.questionId = answer.questionId')
      .where('answer.attemptId = :attemptId', { attemptId })
      .andWhere('answer.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('answer.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('question.type IN (:...questionTypes)', { questionTypes: [QuestionType.SUBJECTIVE, QuestionType.ESSAY] })
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
    const pendingSubjectiveAnswers = attemptAnswers.filter(answer => {
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
    const finalScore = await this.calculateTotalAttemptScore(attemptId, authContext);

    
    // Ensure final score is a proper number
    const validatedFinalScore = Number(finalScore) || 0;
    
    attempt.score = validatedFinalScore;
    attempt.reviewStatus = attemptReviewStatus;
    attempt.updatedBy = authContext.userId;

    // Only set result when attempt is fully reviewed
    if (attemptReviewStatus === ReviewStatus.REVIEWED) {
      attempt.result = validatedFinalScore >= test.passingMarks ? ResultType.PASS : ResultType.FAIL;
    }

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
      .andWhere('attempt.reviewStatus IN (:...reviewStatuses)', { reviewStatuses: [ReviewStatus.PENDING, ReviewStatus.UNDER_REVIEW] })
      .andWhere('question.gradingType = :gradingType', { gradingType: GradingType.ASSIGNMENT })
      .andWhere('answers.reviewStatus = :answerReviewStatus', { answerReviewStatus: 'P' })
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
   * Calculates the total score from all answers for an attempt.
   * 
   * This function uses a direct SQL query to sum all scores efficiently.
   * 
   * @param attemptId - The ID of the test attempt to calculate total score for
   * @param authContext - Authentication context for tenant/organization filtering
   * @returns Promise<number> - The total score from all answers
   */
  private async calculateTotalAttemptScore(attemptId: string, authContext: AuthContext): Promise<number> {
    const result = await this.testUserAnswerRepository
      .createQueryBuilder('answer')
      .select('COALESCE(SUM(answer.score), 0)', 'totalScore')
      .where('answer.attemptId = :attemptId', { attemptId })
      .andWhere('answer.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('answer.organisationId = :organisationId', { organisationId: authContext.organisationId })
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
   * @returns number - The calculated score for this question
   */
  private async calculateQuestionScore(answerData: any, question: Question): Promise<number> {
    // Get question options for validation
    const options = await this.getQuestionOptions(question.questionId);
    
    let score: number;
    
    switch (question.type) {
      case QuestionType.MCQ:
      case QuestionType.TRUE_FALSE:
        score = this.calculateMCQScore(answerData, question, options);
        break;
        
      case QuestionType.MULTIPLE_ANSWER:
        score = this.calculateMultipleAnswerScore(answerData, question, options);
        break;
        
      case QuestionType.FILL_BLANK:
        score = this.calculateFillBlankScore(answerData, question, options);
        break;
        
      case QuestionType.MATCH:
        score = this.calculateMatchScore(answerData, question, options);
        break;
        
      case QuestionType.SUBJECTIVE:
      case QuestionType.ESSAY:
        // Subjective questions are scored manually
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
  private calculateMCQScore(answerData: any, question: Question, options: QuestionOption[]): number {
    const selectedOptionIds = answerData.selectedOptionIds || [];
    
    // MCQ should have exactly one correct option
    const correctOption = options.find(opt => opt.isCorrect);
    if (!correctOption) return 0;
    // Check if the selected option is correct
    const isCorrect = selectedOptionIds.length === 1 && 
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
  private calculateMultipleAnswerScore(answerData: any, question: Question, options: QuestionOption[]): number {
    const selectedOptionIds = answerData.selectedOptionIds || [];
    const correctOptions = options.filter(opt => opt.isCorrect);
    
    if (correctOptions.length === 0) return 0;
    
    let totalScore = 0;
    
    // Award marks for correct selections
    for (const correctOption of correctOptions) {
      if (selectedOptionIds.includes(correctOption.questionOptionId)) {
        totalScore += Number(correctOption.marks);
      }
    }
    // Ensure question marks is a valid number
    const questionMarks = Number(question.marks);
    const safeQuestionMarks = isNaN(questionMarks) ? 0 : questionMarks;
    
    // Check if partial scoring is enabled
    if (question.allowPartialScoring) {
      return totalScore;
    } else {
      // Full marks only if all correct options selected and no incorrect ones
      return totalScore === safeQuestionMarks ? safeQuestionMarks : 0;
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
        totalScore += Number(correctOptions[i]?.marks || 0);
      }
    }
    
    // Ensure question marks is a valid number
    const questionMarks = Number(question.marks);
    const safeQuestionMarks = isNaN(questionMarks) ? 0 : questionMarks;
    
    // Check if partial scoring is enabled
    if (question.allowPartialScoring) {
      // Partial scoring: award marks for each correct blank using option marks
      return totalScore;
    } else {
      // All-or-nothing: full marks only if all blanks are correct
      return totalScore === safeQuestionMarks ? safeQuestionMarks : 0;
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
    
    // Process each user match
    for (const userMatch of userMatches) {
      // Find the correct option that matches this user selection
      const correctOption = correctOptions.find(opt => 
        opt.questionOptionId === userMatch.optionId && 
        opt.matchWith === userMatch.matchWith
      );
      if (correctOption) {
        totalScore += Number(correctOption.marks);
      }
    }
    
    // Ensure question marks is a valid number
    const questionMarks = Number(question.marks);
    const safeQuestionMarks = isNaN(questionMarks) ? 0 : questionMarks;
    
    // Check if partial scoring is enabled
    if (question.allowPartialScoring) {
      // Partial scoring: award marks for each correct match using option marks
      return totalScore;
    } else {
      // All-or-nothing: full marks only if all matches are correct
      return totalScore === safeQuestionMarks ? safeQuestionMarks : 0;
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