import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In, DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Test } from './entities/test.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestDto } from './dto/query-test.dto';
import { TestStructureDto } from './dto/test-structure.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { TestStatus, TestType } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestSection } from './entities/test-section.entity';
import { Question } from '../questions/entities/question.entity';
import { UserTestStatusDto } from './dto/user-test-status.dto';
import { TestAttempt, AttemptStatus } from './entities/test-attempt.entity';
import { RESPONSE_MESSAGES } from '@/common/constants/response-messages.constant';
import { OrderingService } from '@/common/services/ordering.service';

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
    private readonly dataSource: DataSource,
    private readonly orderingService: OrderingService,
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
          questions: {
            ordering: 'ASC',
          },
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

    // Get the next available ordering number
    const ordering = await this.orderingService.getNextQuestionOrder(testId, sectionId, authContext);

    // Add question to test
    const testQuestion = this.testQuestionRepository.create({
      testId,
      sectionId,
      questionId,
      ordering,
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
        ordering = await this.orderingService.getNextQuestionOrder(testId, sectionId, authContext);
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

    // Get all attempts for this user and test
    const attempts = await this.testRepository.manager.find(TestAttempt, {
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { startedAt: 'DESC' },
    });

    const totalAttempts = attempts.length;
    const maxAttempts = test.attempts;

    if (attempts.length === 0) {
      // No attempts yet - user can start a new attempt
      return {
        canResume: false,
        canReattempt: true,
        lastAttemptStatus: null,
        lastAttemptId: null,
        maxAttempts,
        totalAttempts,
      };
    }

    const lastAttempt = attempts[0];

    // Check if user can resume (has an in-progress attempt)
    const canResume = lastAttempt.status === AttemptStatus.IN_PROGRESS; 

    // Check if user can reattempt (hasn't reached max attempts)
    const canReattempt = totalAttempts < maxAttempts;

    return {
      canResume,
      canReattempt,
      lastAttemptStatus: lastAttempt.status,
      lastAttemptId: lastAttempt.attemptId,
      maxAttempts,
      totalAttempts,
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

} 