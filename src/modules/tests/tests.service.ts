import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Test } from './entities/test.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestDto } from './dto/query-test.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { TestStatus, TestType } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';

@Injectable()
export class TestsService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(TestQuestion)
    private readonly testQuestionRepository: Repository<TestQuestion>,
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
        'sections.questions',
        'questions',
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

  async addQuestionToTest(testId: string, sectionId: string, questionId: string, authContext: AuthContext): Promise<void> {
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
      isCompulsory: false,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    });

    await this.testQuestionRepository.save(testQuestion);
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
} 