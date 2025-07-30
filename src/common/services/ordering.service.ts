import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { TestSection } from '@/modules/tests/entities/test-section.entity';
import { TestQuestion } from '@/modules/tests/entities/test-question.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';

@Injectable()
export class OrderingService {
  constructor(
    @InjectRepository(TestSection)
    private readonly sectionRepository: Repository<TestSection>,
    @InjectRepository(TestQuestion)
    private readonly testQuestionRepository: Repository<TestQuestion>,
  ) {}

  /**
   * Private helper method to build and execute ordering queries
   */
  private async executeOrderingQuery<T>(
    queryBuilder: SelectQueryBuilder<T>,
    testId: string,
    authContext: AuthContext,
    sectionId?: string
  ): Promise<number> {
    // Apply common where clauses
    queryBuilder
      .where(`${queryBuilder.alias}.testId = :testId`, { testId })
      .andWhere(`${queryBuilder.alias}.tenantId = :tenantId`, { tenantId: authContext.tenantId })
      .andWhere(`${queryBuilder.alias}.organisationId = :organisationId`, { organisationId: authContext.organisationId });

    // Apply section-specific where clause if provided
    if (sectionId) {
      queryBuilder.andWhere(`${queryBuilder.alias}.sectionId = :sectionId`, { sectionId });
    }

    // Select max ordering and execute
    const result = await queryBuilder
      .select(`MAX(${queryBuilder.alias}.ordering)`, 'maxOrdering')
      .getRawOne();
    
    return (result?.maxOrdering || 0) + 1;
  }

  /**
   * Get the next available ordering for sections within a test
   */
  async getNextSectionOrder(testId: string, authContext: AuthContext): Promise<number> {
    const queryBuilder = this.sectionRepository.createQueryBuilder('ts');
    return this.executeOrderingQuery(queryBuilder, testId, authContext);
  }

  /**
   * Get the next available ordering for questions within a section
   */
  async getNextQuestionOrder(testId: string, sectionId: string, authContext: AuthContext): Promise<number> {
    const queryBuilder = this.testQuestionRepository.createQueryBuilder('tq');
    return this.executeOrderingQuery(queryBuilder, testId, authContext, sectionId);
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
    const queryBuilder = queryRunner.manager.createQueryBuilder(TestQuestion, 'tq');
    return this.executeOrderingQuery(queryBuilder, testId, authContext, sectionId);
  }

} 