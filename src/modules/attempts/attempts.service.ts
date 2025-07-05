import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TestAttempt, AttemptStatus, SubmissionType, ReviewStatus, ResultType } from '../tests/entities/test-attempt.entity';
import { TestUserAnswer, ReviewStatus as AnswerReviewStatus } from '../tests/entities/test-user-answer.entity';
import { Test, TestType, TestStatus, AttemptsGradeMethod } from '../tests/entities/test.entity';
import { TestQuestion } from '../tests/entities/test-question.entity';
import { TestRule } from '../tests/entities/test-rule.entity';
import { TestSection } from '../tests/entities/test-section.entity';
import { Question, QuestionType, GradingType } from '../questions/entities/question.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ReviewAttemptDto } from './dto/review-answer.dto';
import { ResumeAttemptDto } from './dto/resume-attempt.dto';
import { StartNewAttemptDto } from './dto/start-new-attempt.dto';
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
    const existingAttempts = await this.attemptRepository.find({
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { startedAt: 'DESC' },
    });

    const totalAttempts = existingAttempts.length;
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
      organisationId: authContext.organisationId,
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

    // Validate questions have correct options
    await this.validateQuestionsHaveCorrectOptions(testId, authContext);

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

  async submitAnswer(attemptId: string, submitAnswerDto: SubmitAnswerDto[], authContext: AuthContext): Promise<void> {
    // Convert single answer to array for unified processing
    const answersArray = Array.isArray(submitAnswerDto) ? submitAnswerDto : [submitAnswerDto];
    
    if (answersArray.length === 0) {
      return;
    }

    // Verify attempt exists and belongs to user (only once)
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

    // Validate all answers first
    for (const answerDto of answersArray) {
      this.validateAnswer(answerDto.answer, questionMap.get(answerDto.questionId));
    }

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
    let lastQuestionOrdering = attempt.currentPosition || 0;

    for (const answerDto of answersArray) {
      const answerJson = JSON.stringify(answerDto.answer);
      const question = questionMap.get(answerDto.questionId);
      const existingAnswer = existingAnswersMap.get(answerDto.questionId);

      // Determine if question is objective (can be auto-graded)
      const isObjective = question && (
        question.type === QuestionType.MCQ ||
        question.type === QuestionType.TRUE_FALSE ||
        question.type === QuestionType.MULTIPLE_ANSWER ||
        question.type === QuestionType.FILL_BLANK ||
        question.type === QuestionType.MATCH
      );

      // Calculate score and review status based on question type
      let score = null;
      let reviewStatus = 'P' as any; // Default to PENDING

      if (isObjective) {
        // Auto-grade objective questions
        score = this.calculateQuestionScore(answerDto.answer, question);
        reviewStatus = 'N' as any; // NOT_APPLICABLE for objective questions
      } else if (question && (question.type === QuestionType.SUBJECTIVE || question.type === QuestionType.ESSAY)) {
        // Subjective questions remain pending for manual review
        score = null;
        reviewStatus = 'P' as any; // PENDING for subjective questions
      }

      if (existingAnswer) {
        existingAnswer.answer = answerJson;
        existingAnswer.score = score;
        existingAnswer.reviewStatus = reviewStatus;
        existingAnswer.updatedAt = new Date();
        answersToUpdate.push(existingAnswer);
      } else {
        const userAnswer = this.testUserAnswerRepository.create({
          attemptId,
          questionId: answerDto.questionId,
          answer: answerJson,
          score: score,
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

    // Trigger plugin events for each answer
    for (const answerDto of answersArray) {
      const question = questionMap.get(answerDto.questionId);
      const isObjective = question && (
        question.type === QuestionType.MCQ ||
        question.type === QuestionType.TRUE_FALSE ||
        question.type === QuestionType.MULTIPLE_ANSWER ||
        question.type === QuestionType.FILL_BLANK ||
        question.type === QuestionType.MATCH
      );

      await this.pluginManager.triggerEvent(
        PluginManagerService.EVENTS.ANSWER_SUBMITTED,
        {
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
          userId: authContext.userId,
        },
        {
          attemptId,
          questionId: answerDto.questionId,
          timeSpent: answerDto.timeSpent,
          answer: answerDto.answer,
          currentPosition: attempt.currentPosition,
          isObjective: isObjective,
          score: isObjective ? this.calculateQuestionScore(answerDto.answer, question) : null,
        }
      );
    }
  }

  async submitAttempt(attemptId: string, authContext: AuthContext): Promise<TestAttempt & { totalMarks: number }> {
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

    // Check if attempt is already submitted
    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new Error('Attempt is already submitted');
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

    // Calculate total marks for this attempt
    const totalMarks = await this.calculateTotalMarks(attemptId, authContext);

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

    // Determine evaluation strategy based on test.isObjective flag
    if (test.isObjective) {
      // Auto-evaluate all questions (objective test)
      const score = await this.calculateObjectiveScore(attemptId, authContext);
      const validatedScore = Number(score) || 0;
      attempt.score = validatedScore; // Assign the calculated score in marks
      attempt.result = validatedScore >= test.passingMarks ? ResultType.PASS : ResultType.FAIL;
      attempt.reviewStatus = ReviewStatus.NOT_APPLICABLE;

      // Only update answers that don't have scores or have incorrect review status
      for (const answer of userAnswers) {
        const question = questionMap.get(answer.questionId);
        if (!question) continue;

        const needsUpdate = answer.score === null || 
                           answer.score === undefined || 
                           answer.reviewStatus !== ReviewStatus.NOT_APPLICABLE;

        if (needsUpdate) {
          const questionScore = this.calculateQuestionScore(JSON.parse(answer.answer), question);
          const validatedQuestionScore = Number(questionScore) || 0;
          
          await this.testUserAnswerRepository.update(
            {
              attemptId,
              questionId: answer.questionId,
              tenantId: authContext.tenantId,
              organisationId: authContext.organisationId,
            },
            {
              reviewStatus: AnswerReviewStatus.NOT_APPLICABLE,
              score: validatedQuestionScore,
            }
          );
        }
      }
    } else {
      // Check if test has subjective questions
      const hasSubjectiveQuestions = await this.hasSubjectiveQuestions(attemptId, authContext);
      
      if (hasSubjectiveQuestions) {
        // Auto-evaluate objective questions and mark subjective for review
        const objectiveScore = await this.calculateObjectiveScore(attemptId, authContext);
        const validatedObjectiveScore = Number(objectiveScore) || 0;
        attempt.score = validatedObjectiveScore; // Partial score from objective questions
        attempt.result = null;
        attempt.reviewStatus = ReviewStatus.PENDING;

        // Update answer review statuses based on question type
        for (const answer of userAnswers) {
          const question = questionMap.get(answer.questionId);
          if (!question) continue;

          const isSubjective = question.type === QuestionType.SUBJECTIVE || question.type === QuestionType.ESSAY;
          
          if (isSubjective) {
            // Mark subjective questions for review (only if not already marked)
            if (answer.reviewStatus !== AnswerReviewStatus.PENDING) {
              await this.testUserAnswerRepository.update(
                {
                  attemptId,
                  questionId: answer.questionId,
                  tenantId: authContext.tenantId,
                  organisationId: authContext.organisationId,
                },
                {
                  reviewStatus: AnswerReviewStatus.PENDING,
                  score: null, // Score will be set during review
                }
              );
            }
          } else {
            // Auto-score objective questions (only if not already scored)
            const needsUpdate = answer.score === null || 
                               answer.score === undefined || 
                               answer.reviewStatus !== AnswerReviewStatus.NOT_APPLICABLE;

            if (needsUpdate) {
              const questionScore = this.calculateQuestionScore(JSON.parse(answer.answer), question);
              const validatedQuestionScore = Number(questionScore) || 0;
              
              await this.testUserAnswerRepository.update(
                {
                  attemptId,
                  questionId: answer.questionId,
                  tenantId: authContext.tenantId,
                  organisationId: authContext.organisationId,
                },
                {
                  reviewStatus: AnswerReviewStatus.NOT_APPLICABLE,
                  score: validatedQuestionScore,
                }
              );
            }
          }
        }
      } else {
        // All questions are objective, auto-evaluate
        const score = await this.calculateObjectiveScore(attemptId, authContext);
        const validatedScore = Number(score) || 0;
        attempt.score = validatedScore;
        attempt.result = validatedScore >= test.passingMarks ? ResultType.PASS : ResultType.FAIL;
        attempt.reviewStatus = ReviewStatus.NOT_APPLICABLE;

        // Only update answers that don't have scores or have incorrect review status
        for (const answer of userAnswers) {
          const question = questionMap.get(answer.questionId);
          if (!question) continue;

          const needsUpdate = answer.score === null || 
                             answer.score === undefined || 
                             answer.reviewStatus !== AnswerReviewStatus.NOT_APPLICABLE;

          if (needsUpdate) {
            const questionScore = this.calculateQuestionScore(JSON.parse(answer.answer), question);
            const validatedQuestionScore = Number(questionScore) || 0;
            
            await this.testUserAnswerRepository.update(
              {
                attemptId,
                questionId: answer.questionId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
              },
              {
                reviewStatus: AnswerReviewStatus.NOT_APPLICABLE,
                score: validatedQuestionScore,
              }
            );
          }
        }
      }
    }

    // Update attempt status
    attempt.status = AttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.submissionType = SubmissionType.SELF;

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
        isObjective: test.isObjective,
      }
    );

    return { ...savedAttempt, totalMarks };
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

    // Validate attempt status
    if (attempt.status !== AttemptStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted attempts can be reviewed');
    }

    // Validate review status
    if (attempt.reviewStatus !== ReviewStatus.PENDING) {
      throw new BadRequestException('Only attempts with pending review status can be reviewed');
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

    // Get all answers for this attempt to validate
    const attemptAnswers = await this.testUserAnswerRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    // Get questions for validation
    const questionIds = attemptAnswers.map(answer => answer.questionId);
    const questions = await this.questionRepository.find({
      where: {
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    const questionMap = new Map(questions.map(q => [q.questionId, q]));

    // Validate review data
    const reviewedQuestionIds = new Set();
    for (const answerReview of reviewDto.answers) {
      // Check for duplicate question reviews
      if (reviewedQuestionIds.has(answerReview.questionId)) {
        throw new BadRequestException(`Duplicate review for question: ${answerReview.questionId}`);
      }
      reviewedQuestionIds.add(answerReview.questionId);

      // Validate question exists in this attempt
      const answer = attemptAnswers.find(a => a.questionId === answerReview.questionId);
      if (!answer) {
        throw new BadRequestException(`Question ${answerReview.questionId} not found in this attempt`);
      }

      // Validate question exists and is reviewable
      const question = questionMap.get(answerReview.questionId);
      if (!question) {
        throw new BadRequestException(`Question ${answerReview.questionId} not found`);
      }

      // Only subjective and essay questions can be reviewed
      if (question.type !== QuestionType.SUBJECTIVE && question.type !== QuestionType.ESSAY) {
        throw new BadRequestException(`Question ${answerReview.questionId} is not a reviewable question type`);
      }

      // Validate score is within bounds
      const validatedScore = Number(answerReview.score) || 0;
      if (validatedScore < 0 || validatedScore > question.marks) {
        throw new BadRequestException(`Score for question ${answerReview.questionId} must be between 0 and ${question.marks}. Provided: ${validatedScore}`);
      }

      // Validate answer is pending review
      if (answer.reviewStatus !== 'P') { // PENDING
        throw new BadRequestException(`Question ${answerReview.questionId} is not pending review`);
      }
    }

    // Check if all pending subjective questions are being reviewed
    const pendingSubjectiveAnswers = attemptAnswers.filter(answer => {
      const question = questionMap.get(answer.questionId);
      return answer.reviewStatus === 'P' && 
             question && 
             (question.type === QuestionType.SUBJECTIVE || question.type === QuestionType.ESSAY);
    });

    const pendingQuestionIds = new Set(pendingSubjectiveAnswers.map(a => a.questionId));
    const reviewedQuestionIdsSet = new Set(reviewDto.answers.map(a => a.questionId));

    // Check if all pending questions are being reviewed
    for (const pendingQuestionId of pendingQuestionIds) {
      if (!reviewedQuestionIdsSet.has(pendingQuestionId)) {
        throw new BadRequestException(`All pending subjective questions must be reviewed. Missing: ${pendingQuestionId}`);
      }
    }

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

    // Calculate final score by preserving existing auto-graded scores and adding reviewed scores
    let autoGradedScore = 0;
    let reviewedScore = 0;
    let totalScore = 0;

    // Get all answers to calculate the total score
    const allAnswers = await this.testUserAnswerRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    for (const answer of allAnswers) {
      const question = questionMap.get(answer.questionId);

      if (question) {
        const score = Number(answer.score) || 0;
        if (!isNaN(score)) {
          totalScore += score;
          
          // Categorize scores for debugging
          if (answer.reviewStatus === 'N' as any) {
            autoGradedScore += score;
          } else if (answer.reviewStatus === 'R' as any) {
            reviewedScore += score;
          }
        }
      }
    }

    const finalScore = totalScore;
    
    // Ensure final score is a proper number
    const validatedFinalScore = Number(finalScore) || 0;
    
    attempt.score = validatedFinalScore;
    attempt.result = validatedFinalScore >= test.passingMarks ? ResultType.PASS : ResultType.FAIL;
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
        overallRemarks: reviewDto.overallRemarks,
      }
    );

    return savedAttempt;
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
    const scoreBreakdown = [];

    for (const answer of answers) {
      const question = await this.questionRepository.findOne({
        where: { 
          questionId: answer.questionId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
      });

      if (question) {
        // Ensure score is a valid number
        const score = Number(answer.score) || 0;
        if (!isNaN(score)) {
          totalScore += score;
          scoreBreakdown.push({
            questionId: answer.questionId,
            questionType: question.type,
            reviewStatus: answer.reviewStatus,
            score: score,
            marks: question.marks
          });
        }
      }
    }

    // Ensure we return a proper number, not a string
    const finalScore = Number(totalScore) || 0;
    
    return finalScore;
  }

  private async calculateTotalMarks(attemptId: string, authContext: AuthContext): Promise<number> {
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

    return totalMarks;
  }

  async getPendingReviews(authContext: AuthContext): Promise<any[]> {
    return this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('testUserAnswers', 'answers', 'answers.attemptId = attempt.attemptId')
      .leftJoin('questions', 'question', 'question.questionId = answers.questionId')
      .where('attempt.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('attempt.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('attempt.reviewStatus = :reviewStatus', { reviewStatus: ReviewStatus.PENDING })
      .andWhere('(question.type = :subjectiveType OR question.type = :essayType)', { 
        subjectiveType: QuestionType.SUBJECTIVE, 
        essayType: QuestionType.ESSAY 
      })
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
        const selectedQuestionIds = await this.questionPoolService.generateQuestionPool(rule.ruleId, authContext);

        if (selectedQuestionIds.length < rule.numberOfQuestions) {
          throw new Error(`Not enough questions available for rule ${rule.name}. Found ${selectedQuestionIds.length}, required ${rule.numberOfQuestions}`);
        }
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
        // Support both new selectedOptionIds and legacy blanks structure
        const fillBlankAnswers = answer.selectedOptionIds || answer.blanks;
        if (!fillBlankAnswers || fillBlankAnswers.length === 0) {
          throw new Error('Fill-in-the-blank questions require blank answers');
        }
        break;
      case QuestionType.MATCH:
        const matchAnswers = answer.matches;
        if (!matchAnswers || matchAnswers.length === 0) {
          throw new Error('Matching questions require match answers');
        }
        
        // Validate match answer structure
        for (const matchAnswer of matchAnswers) {
          if (!matchAnswer.optionId || !matchAnswer.matchWith) {
            throw new Error('Match answers must have both optionId and matchWith properties');
          }
          if (typeof matchAnswer.optionId !== 'string' || typeof matchAnswer.matchWith !== 'string') {
            throw new Error('Both optionId and matchWith must be strings');
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
      .andWhere('(question.type = :subjectiveType OR question.type = :essayType)', { 
        subjectiveType: QuestionType.SUBJECTIVE, 
        essayType: QuestionType.ESSAY 
      })
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
      .select(['answer.answer', 'answer.questionId'])
      .getMany();

    let totalScore = 0;

    for (const answer of answers) {
      const question = await this.questionRepository.findOne({
        where: { 
          questionId: answer.questionId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
        relations: ['options'], // Load options for proper scoring
      });
      
      if (!question) {
        continue;
      }

      if (!question.options || question.options.length === 0) {
        continue;
      }

      try {
        const answerData = JSON.parse(answer.answer);
        
        // Calculate score based on question type (with allowPartialScoring logic)
        const score = this.calculateQuestionScore(answerData, question);
        const validatedScore = Number(score) || 0;
        
        totalScore += validatedScore;
      } catch (error) {
        continue;
      }
    }

    // Ensure we return a proper number
    return Number(totalScore) || 0;
  }

  private calculateQuestionScore(answerData: any, question: Question): number {
    // Validate input parameters
    if (!question) {
      return 0;
    }

    if (!question.options || question.options.length === 0) {
      return 0;
    }

    if (!answerData) {
      return 0;
    }

    switch (question.type) {
      case QuestionType.MCQ:
      case QuestionType.TRUE_FALSE:
        // Single correct answer - check if selected option is correct
        const selectedOptionId = answerData.selectedOptionIds?.[0];
        if (!selectedOptionId) {
          return 0;
        }
        
        const selectedOption = question.options.find(opt => opt.questionOptionId === selectedOptionId);
        if (!selectedOption) {
          return 0;
        }

        const isCorrect = selectedOption.isCorrect;
        const score = isCorrect ? question.marks : 0;
        
        return score;

      case QuestionType.MULTIPLE_ANSWER:
        // Multiple correct answers - implement partial scoring based on allowPartialScoring flag
        const selectedOptionIds = answerData.selectedOptionIds || [];
        if (selectedOptionIds.length === 0) {
          return 0;
        }

        const correctOptions = question.options.filter(opt => opt.isCorrect);
        const incorrectOptions = question.options.filter(opt => !opt.isCorrect);
        
        if (correctOptions.length === 0) {
          return 0;
        }
        
        // Count correct and incorrect selections
        const correctSelections = selectedOptionIds.filter(id => 
          correctOptions.some(opt => opt.questionOptionId === id)
        ).length;
        
        const incorrectSelections = selectedOptionIds.filter(id => 
          incorrectOptions.some(opt => opt.questionOptionId === id)
        ).length;

        // Calculate score based on allowPartialScoring flag
        if (question.allowPartialScoring) {
          // Partial scoring allowed
          if (incorrectSelections > 0) {
            // Penalty for incorrect selections
            return 0;
          } else if (correctSelections === correctOptions.length) {
            // All correct options selected
            return question.marks;
          } else if (correctSelections > 0) {
            // Partial credit for some correct selections
            return (correctSelections / correctOptions.length) * question.marks;
          }
        } else {
          // All-or-nothing scoring
          if (incorrectSelections > 0 || correctSelections !== correctOptions.length) {
            return 0;
          } else {
            return question.marks;
          }
        }
        return 0;

      case QuestionType.FILL_BLANK:
        // Support both new selectedOptionIds and legacy blanks structure
        const fillBlankAnswers = answerData.selectedOptionIds || answerData.blanks || [];
        if (fillBlankAnswers.length === 0) {
          return 0;
        }

        const correctBlanks = question.options.filter(opt => opt.isCorrect);
        if (correctBlanks.length === 0) {
          return 0;
        }

        let correctBlanksCount = 0;

        for (const blankAnswer of fillBlankAnswers) {
          const correctBlank = correctBlanks.find(opt => opt.blankIndex === blankAnswer.blankIndex);
          if (correctBlank) {
            const userAnswer = blankAnswer.text || blankAnswer.answer || '';
            const correctAnswer = correctBlank.text;
            
            if (correctBlank.caseSensitive) {
              if (userAnswer === correctAnswer) {
                correctBlanksCount++;
              }
            } else {
              if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
                correctBlanksCount++;
              }
            }
          }
        }

        // Apply allowPartialScoring logic
        if (question.allowPartialScoring) {
          return correctBlanksCount > 0 ? (correctBlanksCount / correctBlanks.length) * question.marks : 0;
        } else {
          // All-or-nothing scoring
          return correctBlanksCount === correctBlanks.length ? question.marks : 0;
        }

      case QuestionType.MATCH:
        const matchAnswers = answerData.matches || [];
        if (matchAnswers.length === 0) {
          return 0;
        }

        const correctMatches = question.options.filter(opt => opt.isCorrect);
        if (correctMatches.length === 0) {
          return 0;
        }

        let correctMatchesCount = 0;

        for (const matchAnswer of matchAnswers) {
          const correctMatch = correctMatches.find(opt => 
            opt.questionOptionId === matchAnswer.optionId && 
            opt.matchWith === matchAnswer.matchWith
          );
          if (correctMatch) {
            correctMatchesCount++;
          }
        }

        // Apply allowPartialScoring logic
        if (question.allowPartialScoring) {
          return correctMatchesCount > 0 ? (correctMatchesCount / correctMatches.length) * question.marks : 0;
        } else {
          // All-or-nothing scoring
          return correctMatchesCount === correctMatches.length ? question.marks : 0;
        }

      case QuestionType.SUBJECTIVE:
      case QuestionType.ESSAY:
        // Subjective questions are scored manually, return 0 for auto-scoring
        return 0;

      default:
        return 0;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async getAttempt(attemptId: string, authContext: AuthContext): Promise<ResumeAttemptDto> {
    // Get attempt with test information
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

    // Only allow in-progress attempts to be resumed
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot resume a submitted attempt. Use the result endpoint to view submitted attempt details.');
    }

    // Get test information - use resolved test for rule-based tests
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

    // Get test questions with ordering
    const testQuestions = await this.testQuestionRepository.find({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { ordering: 'ASC' },
    });

    // Get all questions with their options
    const questionIds = testQuestions.map(tq => tq.questionId);
    const questions = await this.questionRepository.find({
      where: {
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['options'],
      order: { ordering: 'ASC' },
    });

    // Get test sections if they exist
    const sections = await this.testSectionRepository.find({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { ordering: 'ASC' },
    });

    // Get user answers for this attempt with additional metadata
    const userAnswers = await this.testUserAnswerRepository.find({
      where: {
        attemptId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { createdAt: 'ASC' },
    });

    // Create a map of answers for quick lookup
    const answersMap = new Map();
    userAnswers.forEach(ua => {
      answersMap.set(ua.questionId, {
        questionId: ua.questionId,
        answer: JSON.parse(ua.answer),
        score: ua.score,
        reviewStatus: ua.reviewStatus,
        remarks: ua.remarks,
        submittedAt: ua.createdAt,
        updatedAt: ua.updatedAt,
      });
    });

    // Organize questions by sections
    const questionsBySection = new Map();
    const questionsWithoutSection = [];

    for (const testQuestion of testQuestions) {
      const question = questions.find(q => q.questionId === testQuestion.questionId);
      if (!question) continue;

      const questionData = {
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
        ordering: testQuestion.ordering,
        isCompulsory: testQuestion.isCompulsory,
        sectionId: testQuestion.sectionId,
        ruleId: testQuestion.ruleId,
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
        userAnswer: answersMap.get(question.questionId) || null,
      };

      if (testQuestion.sectionId) {
        if (!questionsBySection.has(testQuestion.sectionId)) {
          questionsBySection.set(testQuestion.sectionId, []);
        }
        questionsBySection.get(testQuestion.sectionId).push(questionData);
      } else {
        questionsWithoutSection.push(questionData);
      }
    }

    // Build sections with questions
    const sectionsWithQuestions = sections.map(section => ({
      sectionId: section.sectionId,
      title: section.title,
      description: section.description,
      ordering: section.ordering,
      minQuestions: section.minQuestions,
      maxQuestions: section.maxQuestions,
      questions: questionsBySection.get(section.sectionId) || [],
    }));

    // Add questions without sections if any
    if (questionsWithoutSection.length > 0) {
      sectionsWithQuestions.push({
        sectionId: null,
        title: 'General Questions',
        description: 'Questions not assigned to any specific section',
        ordering: 999,
        minQuestions: null,
        maxQuestions: null,
        questions: questionsWithoutSection,
      });
    }

    // Calculate progress metrics
    const totalQuestions = questions.length;
    const answeredQuestions = userAnswers.length;
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    // Determine current position if not set
    let currentPosition = attempt.currentPosition;
    if (!currentPosition && userAnswers.length > 0) {
      // Find the last answered question's position
      const lastAnsweredQuestion = testQuestions.find(tq => 
        userAnswers.some(ua => ua.questionId === tq.questionId)
      );
      currentPosition = lastAnsweredQuestion ? lastAnsweredQuestion.ordering : 1;
    } else if (!currentPosition) {
      currentPosition = 1; // Start from first question
    }

    return {
      testId: attempt.testId,
      resolvedTestId: attempt.resolvedTestId,
      title: test.title,
      description: test.description,
      totalMarks: test.totalMarks,
      timeDuration: test.timeDuration,
      showTime: test.showTime,
      type: test.type,
      passingMarks: test.passingMarks,
      showCorrectAnswer: test.showCorrectAnswer,
      showQuestionsOverview: test.showQuestionsOverview,
      questionsShuffle: test.questionsShuffle,
      answersShuffle: test.answersShuffle,
      paginationLimit: test.paginationLimit,
      showThankyouPage: test.showThankyouPage,
      showAllQuestions: test.showAllQuestions,
      answerSheet: test.answerSheet,
      printAnswersheet: test.printAnswersheet,
      attempt: {
        attemptId: attempt.attemptId,
        userId: attempt.userId,
        attempt: attempt.attempt,
        status: attempt.status,
        reviewStatus: attempt.reviewStatus,
        submissionType: attempt.submissionType,
        result: attempt.result,
        score: attempt.score,
        currentPosition,
        timeSpent: attempt.timeSpent,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        progress: {
          totalQuestions,
          answeredQuestions,
          progressPercentage,
          remainingQuestions: totalQuestions - answeredQuestions,
        },
        timeRemaining: test.timeDuration ? Math.max(0, test.timeDuration - (attempt.timeSpent || 0)) : null,
      },
      sections: sectionsWithQuestions,
    };
  }

  async getAttemptResult(attemptId: string, authContext: AuthContext): Promise<{
    attemptId: string;
    testId: string;
    userId: string;
    status: AttemptStatus;
    reviewStatus: ReviewStatus;
    score: number;
    result: ResultType;
    submittedAt: Date;
    timeSpent: number;
    test: {
      title: string;
      passingMarks: number;
      totalMarks: number;
      isObjective: boolean;
    };
    attempt: Array<{
      questionId: string;
      questionText: string;
      questionType: string;
      marks: number;
      score: number;
      reviewStatus: string;
      remarks?: string;
      reviewedBy?: string;
      reviewedAt?: Date;
      selectedOptionIds?: any[]; // For MCQ, True-False, Multiple Answer, Fill Blank, Match
      text?: string; // For Subjective/Essay
    }>;
  }> {
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
      },
      attempt: answers,
    };
  }

  private async validateQuestionsHaveCorrectOptions(testId: string, authContext: AuthContext): Promise<void> {
    // Get all questions for this test
    const testQuestions = await this.testQuestionRepository.find({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (testQuestions.length === 0) {
      throw new BadRequestException('Test has no questions configured');
    }

    const questionIds = testQuestions.map(tq => tq.questionId);
    const questions = await this.questionRepository.find({
      where: {
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['options'],
    });

    const invalidQuestions = [];

    for (const question of questions) {
      // Skip subjective and essay questions as they don't need correct options
      if (question.type === QuestionType.SUBJECTIVE || question.type === QuestionType.ESSAY) {
        continue;
      }

      // Check if question has options
      if (!question.options || question.options.length === 0) {
        invalidQuestions.push({
          questionId: question.questionId,
          questionText: question.text,
          issue: 'No options configured'
        });
        continue;
      }

      // Check if question has at least one correct option
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        invalidQuestions.push({
          questionId: question.questionId,
          questionText: question.text,
          issue: 'No correct options configured'
        });
      }
    }

    if (invalidQuestions.length > 0) {
      const errorMessage = `Test configuration error: ${invalidQuestions.length} question(s) have invalid configuration:\n` +
        invalidQuestions.map(q => `- "${q.questionText}" (${q.issue})`).join('\n');
      throw new BadRequestException(errorMessage);
    }
  }
} 