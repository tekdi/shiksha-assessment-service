import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { TestSection } from '@/modules/tests/entities/test-section.entity';
import { TestQuestion } from '@/modules/tests/entities/test-question.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';

@Injectable()
export class OrderingService {
  constructor(
    @InjectRepository(TestSection)
    private readonly sectionRepository: Repository<TestSection>,
    @InjectRepository(TestQuestion)
    private readonly questionRepository: Repository<TestQuestion>,
  ) {}

  /**
   * Get the next available ordering for sections within a test
   */
  async getNextSectionOrder(testId: string, authContext: AuthContext): Promise<number> {
    const result = await this.sectionRepository
      .createQueryBuilder('ts')
      .where('ts.testId = :testId', { testId })
      .andWhere('ts.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('ts.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .select('MAX(ts.ordering)', 'maxOrdering')
      .getRawOne();
    
    return (result?.maxOrdering || 0) + 1;
  }

  /**
   * Get the next available ordering for questions within a section
   */
  async getNextQuestionOrder(testId: string, sectionId: string, authContext: AuthContext): Promise<number> {
    const result = await this.questionRepository
      .createQueryBuilder('tq')
      .where('tq.testId = :testId', { testId })
      .andWhere('tq.sectionId = :sectionId', { sectionId })
      .andWhere('tq.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('tq.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .select('MAX(tq.ordering)', 'maxOrdering')
      .getRawOne();
    
    return (result?.maxOrdering || 0) + 1;
  }

  /**
   * Get the next available ordering for questions within a section using a query runner (for transactions)
   */
  async getNextQuestionOrderWithRunner(
    queryRunner: QueryRunner,
    testId: string,
    sectionId: string,
    authContext: AuthContext
  ): Promise<number> {
    const result = await queryRunner.manager
      .createQueryBuilder(TestQuestion, 'tq')
      .where('tq.testId = :testId', { testId })
      .andWhere('tq.sectionId = :sectionId', { sectionId })
      .andWhere('tq.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('tq.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .select('MAX(tq.ordering)', 'maxOrdering')
      .getRawOne();
    
    return (result?.maxOrdering || 0) + 1;
  }

  /**
   * Get the next available ordering for sections within a test using a query runner (for transactions)
   */
  async getNextSectionOrderWithRunner(
    queryRunner: QueryRunner,
    testId: string,
    authContext: AuthContext
  ): Promise<number> {
    const result = await queryRunner.manager
      .createQueryBuilder(TestSection, 'ts')
      .where('ts.testId = :testId', { testId })
      .andWhere('ts.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('ts.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .select('MAX(ts.ordering)', 'maxOrdering')
      .getRawOne();
    
    return (result?.maxOrdering || 0) + 1;
  }
} 