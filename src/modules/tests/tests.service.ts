import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Like, Between, In, Not, FindOptionsWhere, DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Test } from './entities/test.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestDto } from './dto/query-test.dto';
import { TestStructureDto } from './dto/test-structure.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { TestStatus, TestType, AttemptsGradeMethod } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestSection } from './entities/test-section.entity';
import { Question, QuestionType } from '../questions/entities/question.entity';
import { HelperUtil } from '@/common/utils/helper.util';
import { UserTestStatusDto } from './dto/user-test-status.dto';
import { TestAttempt, AttemptStatus, ReviewStatus } from './entities/test-attempt.entity';
import { RESPONSE_MESSAGES } from '@/common/constants/response-messages.constant';

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
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepository: Repository<TestAttempt>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(createTestDto: CreateTestDto, authContext: AuthContext): Promise<Test> {
    // Validate test configuration based on type
    await this.validateTestConfiguration(createTestDto);


     // Generate a simple alias from the title if none provided
     if (!createTestDto.alias) {
      createTestDto.alias = await HelperUtil.generateUniqueAliasWithRepo(
        createTestDto.title,
        this.testRepository,
        authContext.tenantId,
        authContext.organisationId,
      );
    } else {
      // Check if the alias already exists
      const existingTest = await this.testRepository.findOne({
        where: { 
          alias: createTestDto.alias, 
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
          status: Not(TestStatus.ARCHIVED)
        } as FindOptionsWhere<Test>,
      });

      if (existingTest) {
        const originalAlias = createTestDto.alias;
        createTestDto.alias = await HelperUtil.generateUniqueAliasWithRepo(
          originalAlias,
          this.testRepository,
          authContext.tenantId,
          authContext.organisationId,
        );
      }
    }

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
          questions: {
            ordering: 'ASC',
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Extract all question IDs from test questions
    const questionIds = test.sections
      .flatMap(section => section.questions)
      .map(testQuestion => testQuestion.questionId);

    if (questionIds.length === 0) {
      return test;
    }

    // Fetch all questions with options in a single query
    const questions = await this.questionRepository.find({
      where: { questionId: In(questionIds) },
      relations: ['options'],
      order: {
        options: {
          ordering: 'ASC',
        },
      },
    });

    // Create a map for quick lookup
    const questionsMap = new Map(questions.map(q => [q.questionId, q]));

    // Transform questions and attach to test questions
    for (const section of test.sections) {
      for (const testQuestion of section.questions) {
        const question = questionsMap.get(testQuestion.questionId);
        if (question) {
          // Transform the question data to exclude isCorrect from options
          const transformedQuestion = {
            ...question,
            options: question.options?.map(opt => ({
              questionOptionId: opt.questionOptionId,
              text: opt.text,
              media: opt.media,
              ordering: opt.ordering,
              marks: opt.marks,
              caseSensitive: opt.caseSensitive,
              createdAt: opt.createdAt,
              // Exclude blankIndex, matchWith, matchWithMedia and isCorrect for security
            })) || [],
          };

          // For matching questions, add a separate array of matchWith options
          if (question.type === QuestionType.MATCH && question.options?.length > 0) {
            const matchWithOptions = question.options
              .filter(opt => opt.matchWith) // Only include options that have matchWith
              .map(opt => ({
                matchWith: opt.matchWith,
                matchWithMedia: opt.matchWithMedia,
                ordering: opt.ordering,
              }))
              .sort((a, b) => a.ordering - b.ordering); // Sort by ordering

            (transformedQuestion as any).matchWithOptions = matchWithOptions;
          }

          // Replace the test question with the complete question data
          Object.assign(testQuestion, transformedQuestion);
        }
      }
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

    const maxAttempts = test.attempts;

    // Get total attempts count
    const totalAttempts = await this.getTotalAttempts(testId, userId, authContext);
   
    // Get graded attempt based on grading method
    let finalScore: number = 0;
    let finalResult: string | null = null;
    let finalAttemptId: string | null = null;
    let gradedAttemptData: TestAttempt | null = null;

    switch (test.attemptsGrading) {
      case AttemptsGradeMethod.FIRST_ATTEMPT: {
        gradedAttemptData = await this.getFirstAttempt(testId, userId, authContext, test);
        if (gradedAttemptData) {
          finalScore = gradedAttemptData.score || 0;
          finalResult = gradedAttemptData.result || null;
          finalAttemptId = gradedAttemptData.attemptId;
        }
        break;
      }

      case AttemptsGradeMethod.LAST_ATTEMPT: {
        gradedAttemptData = await this.getLastCompletedAttempt(testId, userId, authContext, test);
        if (gradedAttemptData) {
          finalScore = gradedAttemptData.score || 0;
          finalResult = gradedAttemptData.result || null;
          finalAttemptId = gradedAttemptData.attemptId;
        }
        break;
      }

      case AttemptsGradeMethod.HIGHEST: {
        gradedAttemptData = await this.getHighestAttempt(testId, userId, authContext, test);
        if (gradedAttemptData) {
          finalScore = gradedAttemptData.score || 0;
          finalResult = gradedAttemptData.result || null;
          finalAttemptId = gradedAttemptData.attemptId;
        }
        break;
      }

      case AttemptsGradeMethod.AVERAGE: {
        const averageData = await this.getAverageScore(testId, userId, authContext, test);
        if (averageData) {
          finalScore = averageData.averageScore;
          finalResult = finalScore >= test.passingMarks ? 'P' : 'F'; // PASS or FAIL
          
          // Get the last submitted attempt for attemptId reference
          const lastSubmittedAttempt = await this.getLastCompletedAttempt(testId, userId, authContext, test);
          if (lastSubmittedAttempt) {
            finalAttemptId = lastSubmittedAttempt.attemptId;
            gradedAttemptData = lastSubmittedAttempt; // Use for graded attempt object
          }
        }
        break;
      }
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
        resumeAllowed: canResume,
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
   * @param test - The test object to check if it's objective
   * @returns Promise<TestAttempt | null> - The first submitted attempt or null if none exists
   */
  private async getFirstAttempt(testId: string, userId: string, authContext: AuthContext, test: Test): Promise<TestAttempt | null> {
    const where: any = {
      testId,
      userId,
      status: AttemptStatus.SUBMITTED,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    };

    if (!test.isObjective) {
      where.reviewStatus = ReviewStatus.REVIEWED;
    }

    return await this.testAttemptRepository.findOne({
      where,
      order: { attempt: 'ASC' },
    });
  }

  /**
   * Retrieves the last submitted attempt for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @param test - The test object to check if it's objective
   * @returns Promise<TestAttempt | null> - The last submitted attempt or null if none exists
   */
  private async getLastCompletedAttempt(testId: string, userId: string, authContext: AuthContext, test: Test): Promise<TestAttempt | null> {
    const where: any = {
      testId,
      userId,
      status: AttemptStatus.SUBMITTED,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    };

    if (!test.isObjective) {
      where.reviewStatus = ReviewStatus.REVIEWED;
    }

    return await this.testAttemptRepository.findOne({
      where,
      order: { attempt: 'DESC' },
    });
  }

  /**
   * Retrieves the attempt with the highest score for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @param test - The test object to check if it's objective
   * @returns Promise<TestAttempt | null> - The highest scoring attempt or null if none exists
   */
  private async getHighestAttempt(testId: string, userId: string, authContext: AuthContext, test: Test): Promise<TestAttempt | null> {
    const where: any = {
      testId,
      userId,
      status: AttemptStatus.SUBMITTED,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    };

    if (!test.isObjective) {
      where.reviewStatus = ReviewStatus.REVIEWED;
    }

    return await this.testAttemptRepository.findOne({
      where,
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
   * @param test - The test object to check if it's objective
   * @returns Promise<{averageScore: number, attemptCount: number, lastAttemptDate: Date | null} | null> - 
   *          Aggregated score data or null if no submitted attempts exist
   */
  private async getAverageScore(testId: string, userId: string, authContext: AuthContext, test: Test): Promise<{ averageScore: number; attemptCount: number; lastAttemptDate: Date | null } | null> {
    const queryBuilder = this.testAttemptRepository
      .createQueryBuilder('attempt')
      .select([
        'AVG(COALESCE(attempt.score, 0)) as averageScore',
        'COUNT(*) as attemptCount',
        'MAX(attempt.startedAt) as lastAttemptDate'
      ])
      .where('attempt.testId = :testId', { testId })
      .andWhere('attempt.userId = :userId', { userId })
      .andWhere('attempt.status = :status', { status: AttemptStatus.SUBMITTED })
      .andWhere('attempt.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('attempt.organisationId = :organisationId', { organisationId: authContext.organisationId });

    if (!test.isObjective) {
      queryBuilder.andWhere('attempt.reviewStatus = :reviewStatus', { reviewStatus: ReviewStatus.REVIEWED });
    }

    const result = await queryBuilder.getRawOne();

    if (!result || result.attemptCount === '0') {
      return null;
    }

    return {
      averageScore: parseFloat(result.averageScore) || 0,
      attemptCount: parseInt(result.attemptCount) || 0,
      lastAttemptDate: result.lastAttemptDate ? new Date(result.lastAttemptDate) : null,
    };
  }

  async updateTestStructure(testId: string, testStructureDto: TestStructureDto, authContext: AuthContext): Promise<void> {
    // Use transaction for data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate test exists and belongs to tenant/organization
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



      // Get existing sections and questions for validation
      const existingSections = await queryRunner.manager.find(TestSection, {
        where: {
          testId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
      });

      const existingQuestions = await queryRunner.manager.find(TestQuestion, {
        where: {
          testId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
      });

      // Validate all existing sections are included in the structure update
      const existingSectionIds = new Set(existingSections.map(s => s.sectionId));
      const providedSectionIds = new Set(testStructureDto.sections.map(s => s.sectionId));
      const missingSections = existingSections
        .filter(s => !providedSectionIds.has(s.sectionId))
        .map(s => s.sectionId);

      if (missingSections.length > 0) {
        throw new BadRequestException(RESPONSE_MESSAGES.MISSING_SECTIONS_IN_STRUCTURE(missingSections));
      }

      // Validate all existing questions are included in the structure update
      const existingQuestionIds = new Set(existingQuestions.map(q => q.questionId));
      const providedQuestionIds = new Set();
      
      testStructureDto.sections.forEach(section => {
        if (section.questions) {
          section.questions.forEach(question => {
            providedQuestionIds.add(question.questionId);
          });
        }
      });

      const missingQuestions = existingQuestions
        .filter(q => !providedQuestionIds.has(q.questionId))
        .map(q => q.questionId);

      if (missingQuestions.length > 0) {
        throw new BadRequestException(RESPONSE_MESSAGES.MISSING_QUESTIONS_IN_STRUCTURE(missingQuestions));
      }

      // Validate that all sections belong to the test
      const sectionIds = testStructureDto.sections.map(s => s.sectionId);
      const foundSections = await queryRunner.manager.find(TestSection, {
        where: {
          sectionId: In(sectionIds),
          testId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
      });

      if (foundSections.length !== sectionIds.length) {
        throw new BadRequestException(RESPONSE_MESSAGES.SOME_SECTIONS_NOT_FOUND);
      }

      // Validate that all questions belong to the provided sections
      const allQuestionIds = [];
      testStructureDto.sections.forEach(section => {
        if (section.questions) {
          section.questions.forEach(question => {
            allQuestionIds.push(question.questionId);
          });
        }
      });

      if (allQuestionIds.length > 0) {
        const foundQuestions = await queryRunner.manager.find(TestQuestion, {
          where: {
            questionId: In(allQuestionIds),
            testId,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          },
        });

        if (foundQuestions.length !== allQuestionIds.length) {
          throw new BadRequestException(RESPONSE_MESSAGES.QUESTIONS_NOT_FOUND_IN_STRUCTURE);
        }
      }

      // Update section ordering
      for (const sectionData of testStructureDto.sections) {
        await queryRunner.manager.update(TestSection, 
          { sectionId: sectionData.sectionId },
          { ordering: sectionData.order }
        );
      }

      // Update question ordering and placement
      for (const sectionData of testStructureDto.sections) {
        if (sectionData.questions) {
          for (const questionData of sectionData.questions) {
            await queryRunner.manager.update(TestQuestion,
              { 
                testId,
                questionId: questionData.questionId,
                tenantId: authContext.tenantId,
                organisationId: authContext.organisationId,
              },
              { 
                ordering: questionData.order,
                sectionId: sectionData.sectionId
              }
            );
          }
        }
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Invalidate cache
      await this.invalidateTestCache(authContext.tenantId);

    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
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
    return await this.testAttemptRepository.findOne({
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        status: AttemptStatus.IN_PROGRESS,
      },
      order: { attempt: 'DESC' },
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
    return await this.testAttemptRepository.count({
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });
  }


} 