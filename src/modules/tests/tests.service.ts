import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Test } from './entities/test.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestDto } from './dto/query-test.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { TestStatus, TestType, AttemptsGradeMethod } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestSection } from './entities/test-section.entity';
import { Question } from '../questions/entities/question.entity';
import { UserTestStatusDto } from './dto/user-test-status.dto';
import { TestAttempt, AttemptStatus, ReviewStatus } from './entities/test-attempt.entity';

@Injectable()
export class TestsService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(TestQuestion)
    private readonly testQuestionRepository: Repository<TestQuestion>,
    @InjectRepository(TestSection)
    private readonly testSectionRepository: Repository<TestSection>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createTestDto: CreateTestDto, authContext: AuthContext): Promise<Test> {
    // Validate test configuration based on type
    await this.validateTestConfiguration(createTestDto);

    const test = this.testRepository.create({
      ...createTestDto,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
      createdBy: authContext.userId,
    });

    const savedTest = await this.testRepository.save(test);
    
    // Invalidate cache
    await this.invalidateTestCache(authContext.tenantId);
    
    return savedTest;
  }

  async findAll(queryDto: QueryTestDto, authContext: AuthContext) {
    const cacheKey = `tests:${authContext.tenantId}:${JSON.stringify(queryDto)}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { limit = 10, offset = 0, search, status, type, minMarks, maxMarks, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;

    const queryBuilder = this.testRepository
      .createQueryBuilder('test')
      .where('test.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('test.organisationId = :organisationId', { organisationId: authContext.organisationId });

    if (search) {
      queryBuilder.andWhere(
        '(test.title ILIKE :search OR test.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('test.status = :status', { status });
    } else {
      queryBuilder.andWhere('test.status != :status', { status: TestStatus.ARCHIVED });
    }

    if (type) {
      queryBuilder.andWhere('test.type = :type', { type });
    }

    if (minMarks !== undefined || maxMarks !== undefined) {
      if (minMarks !== undefined && maxMarks !== undefined) {
        queryBuilder.andWhere('test.totalMarks BETWEEN :minMarks AND :maxMarks', { minMarks, maxMarks });
      } else if (minMarks !== undefined) {
        queryBuilder.andWhere('test.totalMarks >= :minMarks', { minMarks });
      } else if (maxMarks !== undefined) {
        queryBuilder.andWhere('test.totalMarks <= :maxMarks', { maxMarks });
      }
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy(`test.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip(offset)
      .take(limit);

    const tests = await queryBuilder.getMany();

    const result = {
      content: tests,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1,
      size: limit,
    };

    // Cache for 1 day
    await this.cacheManager.set(cacheKey, result, 86400);

    return result;
  }

  async findOne(id: string, authContext: AuthContext): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: {
        testId: id,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['sections', 'questions'],
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    return test;
  }

  async update(id: string, updateTestDto: UpdateTestDto, authContext: AuthContext): Promise<Test> {
    const test = await this.findOne(id, authContext);

    Object.assign(test, {
      ...updateTestDto,
      updatedBy: authContext.userId,
    });

    const updatedTest = await this.testRepository.save(test);
    
    // Invalidate cache
    await this.invalidateTestCache(authContext.tenantId);
    
    return updatedTest;
  }

  async remove(id: string, authContext: AuthContext, isHardDelete: boolean = false): Promise<void> {
    const test = await this.findOne(id, authContext);
    if (isHardDelete) {
      await this.testRepository.remove(test);
    } else {
      await this.testRepository.update(id, { status: TestStatus.ARCHIVED });
    }
    // Invalidate cache
    await this.invalidateTestCache(authContext.tenantId);
  }

  async getTestHierarchy(id: string, authContext: AuthContext) {
    const test = await this.testRepository.findOne({
      where: {
        testId: id,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: [
        'sections',
        'sections.questions'
      ],
      order: {
        sections: {
          ordering: 'ASC',
        },
        questions: {
          ordering: 'ASC',
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    return test;
  }

  async addQuestionToTest(testId: string, sectionId: string, questionId: string, isCompulsory: boolean = true, authContext: AuthContext): Promise<void> {
    // Validate test type and question addition
    await this.validateQuestionAddition(testId, authContext);

    // Check if question is already in the test
    const existingQuestion = await this.testQuestionRepository.findOne({
      where: {
        testId,
        questionId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (existingQuestion) {
      throw new BadRequestException('Question is already added to this test');
    }

    // Add question to test
    const testQuestion = this.testQuestionRepository.create({
      testId,
      sectionId,
      questionId,
      ordering: 0, // Will be set based on existing questions
      isCompulsory,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    });

    await this.testQuestionRepository.save(testQuestion);
  }

  async addQuestionsBulkToTest(testId: string, sectionId: string, questions: Array<{ questionId: string; ordering?: number; isCompulsory?: boolean }>, authContext: AuthContext): Promise<{ added: number; skipped: number; errors: string[] }> {
    // Validate test type and question addition
    await this.validateQuestionAddition(testId, authContext);

    // Validate that the section belongs to the test
    const section = await this.testSectionRepository.findOne({
      where: {
        sectionId,
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found or does not belong to the specified test');
    }

    const result = {
      added: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Get existing questions in the test to avoid duplicates
    const existingQuestions = await this.testQuestionRepository.find({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      select: ['questionId'],
    });

    const existingQuestionIds = new Set(existingQuestions.map(q => q.questionId));

    // Validate that all questions exist
    const questionIds = questions.map(q => q.questionId);
    const foundQuestions = await this.questionRepository.find({
      where: {
        questionId: In(questionIds),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      select: ['questionId'],
    });

    const foundQuestionIds = new Set(foundQuestions.map(q => q.questionId));
    const notFoundQuestionIds = questionIds.filter(id => !foundQuestionIds.has(id));

    if (notFoundQuestionIds.length > 0) {
      result.errors.push(`Questions not found: ${notFoundQuestionIds.join(', ')}`);
    }

    // Process each question
    const questionsToAdd = [];
    for (const questionData of questions) {
      if (!foundQuestionIds.has(questionData.questionId)) {
        continue; // Skip questions that don't exist
      }

      if (existingQuestionIds.has(questionData.questionId)) {
        result.skipped++;
        continue; // Skip questions that are already in the test
      }

      // Determine ordering
      let ordering = questionData.ordering;
      if (ordering === undefined) {
        // Get the next available ordering number
        const maxOrdering = await this.testQuestionRepository
          .createQueryBuilder('tq')
          .where('tq.testId = :testId', { testId })
          .andWhere('tq.sectionId = :sectionId', { sectionId })
          .andWhere('tq.tenantId = :tenantId', { tenantId: authContext.tenantId })
          .andWhere('tq.organisationId = :organisationId', { organisationId: authContext.organisationId })
          .select('MAX(tq.ordering)', 'maxOrdering')
          .getRawOne();

        ordering = (maxOrdering?.maxOrdering || 0) + 1;
      }

      questionsToAdd.push({
        testId,
        sectionId,
        questionId: questionData.questionId,
        ordering,
        isCompulsory: questionData.isCompulsory || false,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      });

      existingQuestionIds.add(questionData.questionId); // Mark as added to avoid duplicates in the same request
    }

    // Add all questions in a batch
    if (questionsToAdd.length > 0) {
      await this.testQuestionRepository
        .createQueryBuilder()
        .insert()
        .into(TestQuestion)
        .values(questionsToAdd)
        .execute();
      result.added = questionsToAdd.length;
    }

    return result;
  }

  private async invalidateTestCache(tenantId: string): Promise<void> {
    // For now, we'll use a simple approach to invalidate cache
    // In a production environment, you might want to use Redis SCAN or similar
    try {
      // Set a cache invalidation timestamp that can be checked
      await this.cacheManager.set(`test_cache_invalidated:${tenantId}`, Date.now(), 86400);
    } catch (error) {
      // Log error but don't fail the operation
      console.warn('Failed to invalidate test cache:', error);
    }
  }

  private async validateTestConfiguration(createTestDto: CreateTestDto): Promise<void> {
    // Validate test type configuration
    switch (createTestDto.type) {
      case TestType.PLAIN:
        // Plain tests should have basic configuration
        if (!createTestDto.title || !createTestDto.totalMarks) {
          throw new BadRequestException('Plain tests require title and total marks');
        }
        break;

      case TestType.RULE_BASED:
      case TestType.GENERATED:
        // Rule-based and generated tests require additional configuration
        if (!createTestDto.title || !createTestDto.totalMarks) {
          throw new BadRequestException(`${createTestDto.type} tests require title and total marks`);
        }
        break;

      default:
        throw new BadRequestException(`Unsupported test type: ${createTestDto.type}`);
    }
  }

  private async validateQuestionAddition(testId: string, authContext: AuthContext): Promise<void> {
    // Get the test to check its type
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

    // Check if test is published (can't modify published tests)
    if (test.status === TestStatus.PUBLISHED) {
      throw new BadRequestException('Cannot modify questions of a published test');
    }

    // Validate based on test type
    switch (test.type) {
      case TestType.PLAIN:
        // Plain tests can have questions added directly to sections
        // No additional validation needed
        break;

      case TestType.RULE_BASED:
        // Rule-based tests can have questions added to sections
        // Questions can be used by rules for dynamic selection
        // No additional validation needed
        break;

      case TestType.GENERATED:
        // Generated tests are created automatically during attempts
        // Should not allow manual question addition
        throw new BadRequestException('Cannot manually add questions to generated tests. They are created automatically during test attempts.');

      default:
        throw new BadRequestException(`Unsupported test type: ${test.type}`);
    }
  }

  async getUserTestStatus(testId: string, userId: string, authContext: AuthContext): Promise<UserTestStatusDto> {
    // Check if test exists
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

    // Get total attempts count (lightweight query)
    const totalAttempts = await this.getTotalAttempts(testId, userId, authContext);
    const maxAttempts = test.attempts;

    // Handle case where user has no attempts yet
    if (totalAttempts === 0) {
      return {
        testId,
        totalAttemptsAllowed: maxAttempts,
        attemptsMade: 0,
        canAttempt: true, // User can start their first attempt
        canResume: false, // No attempts to resume
        attemptGrading: test.attemptsGrading,
        gradedAttempt: null, // No graded attempt yet
        lastAttempt: null, // No last attempt
        showCorrectAnswers: test.showCorrectAnswer,
      };
    }

    // Check if there are any attempts under review (lightweight query)
    const hasPendingReview = await this.hasPendingReview(testId, userId, authContext);

    // Get graded attempt based on grading method (optimized query)
    let finalScore: number = 0;
    let finalResult: string | null = null;
    let finalAttemptId: string | null = null;
    let gradedAttemptData: TestAttempt | null = null;

    switch (test.attemptsGrading) {
      case AttemptsGradeMethod.FIRST_ATTEMPT: {
        gradedAttemptData = await this.getFirstAttempt(testId, userId, authContext);
        if (gradedAttemptData) {
          finalScore = gradedAttemptData.score || 0;
          finalResult = gradedAttemptData.result || null;
          finalAttemptId = gradedAttemptData.attemptId;
        }
        break;
      }

      case AttemptsGradeMethod.LAST_ATTEMPT: {
        gradedAttemptData = await this.getLastAttempt(testId, userId, authContext);
        if (gradedAttemptData) {
          finalScore = gradedAttemptData.score || 0;
          finalResult = gradedAttemptData.result || null;
          finalAttemptId = gradedAttemptData.attemptId;
        }
        break;
      }

      case AttemptsGradeMethod.HIGHEST: {
        gradedAttemptData = await this.getHighestAttempt(testId, userId, authContext);
        if (gradedAttemptData) {
          finalScore = gradedAttemptData.score || 0;
          finalResult = gradedAttemptData.result || null;
          finalAttemptId = gradedAttemptData.attemptId;
        }
        break;
      }

      case AttemptsGradeMethod.AVERAGE: {
        const averageData = await this.getAverageScore(testId, userId, authContext);
        if (averageData) {
          finalScore = averageData.averageScore;
          finalResult = finalScore >= test.passingMarks ? 'P' : 'F'; // PASS or FAIL
          
          // Get the last submitted attempt for attemptId reference
          const lastSubmittedAttempt = await this.getLastAttempt(testId, userId, authContext);
          if (lastSubmittedAttempt) {
            finalAttemptId = lastSubmittedAttempt.attemptId;
            gradedAttemptData = lastSubmittedAttempt; // Use for graded attempt object
          }
        }
        break;
      }
    }

    // If there are any attempts under review, set finalResult to null
    if (hasPendingReview) {
      finalResult = null;
    }

    // Check if user can attempt (hasn't reached max attempts)
    const canAttempt = totalAttempts < maxAttempts;

    // Get last attempt for resume check (lightweight query)
    const lastAttempt = await this.getLastAttemptForResume(testId, userId, authContext);
    const canResume = lastAttempt?.status === AttemptStatus.IN_PROGRESS;

    // Build graded attempt object
    let gradedAttempt = null;
    if (gradedAttemptData && finalAttemptId) {
      gradedAttempt = {
        attemptId: gradedAttemptData.attemptId,
        status: gradedAttemptData.status,
        score: finalScore,
        result: finalResult,
        submittedAt: gradedAttemptData.submittedAt,
      };
    }

    // Build last attempt object
    let lastAttemptInfo = null;
    if (lastAttempt) {
      lastAttemptInfo = {
        attemptId: lastAttempt.attemptId,
        status: lastAttempt.status,
        resumeAllowed: lastAttempt.status === AttemptStatus.IN_PROGRESS,
      };
    }

    return {
      testId,
      totalAttemptsAllowed: maxAttempts,
      attemptsMade: totalAttempts,
      canAttempt,
      canResume,
      attemptGrading: test.attemptsGrading,
      gradedAttempt,
      lastAttempt: lastAttemptInfo,
      showCorrectAnswers: test.showCorrectAnswer,
    };
  }

  /**
   * Retrieves the first submitted attempt for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<TestAttempt | null> - The first submitted attempt or null if none exists
   */
  private async getFirstAttempt(testId: string, userId: string, authContext: AuthContext): Promise<TestAttempt | null> {
    return await this.testRepository.manager.findOne(TestAttempt, {
      where: {
        testId,
        userId,
        status: AttemptStatus.SUBMITTED,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { startedAt: 'ASC' },
    });
  }

  /**
   * Retrieves the last submitted attempt for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<TestAttempt | null> - The last submitted attempt or null if none exists
   */
  private async getLastAttempt(testId: string, userId: string, authContext: AuthContext): Promise<TestAttempt | null> {
    return await this.testRepository.manager.findOne(TestAttempt, {
      where: {
        testId,
        userId,
        status: AttemptStatus.SUBMITTED,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { startedAt: 'DESC' },
    });
  }

  /**
   * Retrieves the attempt with the highest score for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<TestAttempt | null> - The highest scoring attempt or null if none exists
   */
  private async getHighestAttempt(testId: string, userId: string, authContext: AuthContext): Promise<TestAttempt | null> {
    return await this.testRepository.manager.findOne(TestAttempt, {
      where: {
        testId,
        userId,
        status: AttemptStatus.SUBMITTED,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { score: 'DESC' },
    });
  }

  /**
   * Calculates the average score across all submitted attempts for a user and test.
   * Uses database aggregation for optimal performance instead of fetching all attempts.
   * Handles null scores by treating them as 0 using COALESCE.
   * 
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<{averageScore: number, attemptCount: number, lastAttemptDate: Date | null} | null> - 
   *          Aggregated score data or null if no submitted attempts exist
   */
  private async getAverageScore(testId: string, userId: string, authContext: AuthContext): Promise<{ averageScore: number; attemptCount: number; lastAttemptDate: Date | null } | null> {
    const result = await this.testRepository.manager
      .createQueryBuilder(TestAttempt, 'attempt')
      .select([
        'AVG(COALESCE(attempt.score, 0)) as averageScore',
        'COUNT(*) as attemptCount',
        'MAX(attempt.startedAt) as lastAttemptDate'
      ])
      .where('attempt.testId = :testId', { testId })
      .andWhere('attempt.userId = :userId', { userId })
      .andWhere('attempt.status = :status', { status: AttemptStatus.SUBMITTED })
      .andWhere('attempt.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('attempt.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .getRawOne();

    if (!result || result.attemptCount === '0') {
      return null;
    }

    return {
      averageScore: parseFloat(result.averageScore) || 0,
      attemptCount: parseInt(result.attemptCount) || 0,
      lastAttemptDate: result.lastAttemptDate ? new Date(result.lastAttemptDate) : null,
    };
  }

  /**
   * Checks if any attempts for a user and test are currently under review.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<boolean> - True if any attempts have pending review status
   */
  private async hasPendingReview(testId: string, userId: string, authContext: AuthContext): Promise<boolean> {
    const count = await this.testRepository.manager.count(TestAttempt, {
      where: {
        testId,
        userId,
        reviewStatus: ReviewStatus.PENDING,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });
    return count > 0;
  }

  /**
   * Retrieves the most recent attempt (any status) for a user and test.
   * Used to determine if a user can resume an in-progress attempt.
   * 
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<TestAttempt | null> - The most recent attempt or null if none exists
   */
  private async getLastAttemptForResume(testId: string, userId: string, authContext: AuthContext): Promise<TestAttempt | null> {
    return await this.testRepository.manager.findOne(TestAttempt, {
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { startedAt: 'DESC' },
    });
  }

  /**
   * Counts the total number of attempts (any status) for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<number> - The total number of attempts made by the user
   */
  private async getTotalAttempts(testId: string, userId: string, authContext: AuthContext): Promise<number> {
    return await this.testRepository.manager.count(TestAttempt, {
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });
  }


} 