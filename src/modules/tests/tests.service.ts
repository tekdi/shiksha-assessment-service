import { Injectable, NotFoundException } from '@nestjs/common';
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
import { TestStatus } from './entities/test.entity';

@Injectable()
export class TestsService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createTestDto: CreateTestDto, authContext: AuthContext): Promise<Test> {
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
} 