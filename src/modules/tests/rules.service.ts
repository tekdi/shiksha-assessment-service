import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestRule } from './entities/test-rule.entity';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { Test, TestType, TestStatus } from './entities/test.entity';
import { Question } from '../questions/entities/question.entity';

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(TestRule)
    private readonly ruleRepository: Repository<TestRule>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async create(createRuleDto: CreateRuleDto, authContext: AuthContext): Promise<TestRule> {
    // Validate test type and rule configuration
    if (createRuleDto.testId) {
      await this.validateRuleConfiguration(createRuleDto.testId, authContext);
    }
    const rule = this.ruleRepository.create({
      ...createRuleDto,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
      createdBy: authContext.userId,
    });
    return this.ruleRepository.save(rule);
  }

  async findAll(authContext: AuthContext, testId?: string, sectionId?: string): Promise<TestRule[]> {
    const whereClause: any = {
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    };

    if (testId) {
      whereClause.testId = testId;
    }

    if (sectionId) {
      whereClause.sectionId = sectionId;
    }

    return this.ruleRepository.find({
      where: whereClause,
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, authContext: AuthContext): Promise<TestRule> {
    const rule = await this.ruleRepository.findOne({
      where: {
        ruleId: id,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    return rule;
  }

  async update(id: string, updateRuleDto: UpdateRuleDto, authContext: AuthContext): Promise<TestRule> {
    const rule = await this.findOne(id, authContext);
    Object.assign(rule, {
      ...updateRuleDto,
      updatedBy: authContext.userId,
    });
    return this.ruleRepository.save(rule);
  }

  async remove(id: string, authContext: AuthContext): Promise<void> {
    const rule = await this.findOne(id, authContext);
    await this.ruleRepository.remove(rule);
  }

  async getRulesForTest(testId: string, authContext: AuthContext): Promise<TestRule[]> {
    return this.ruleRepository.find({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        isActive: true,
      },
      order: { priority: 'DESC' },
    });
  }

  async getRulesForSection(sectionId: string, authContext: AuthContext): Promise<TestRule[]> {
    return this.ruleRepository.find({
      where: {
        sectionId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        isActive: true,
      },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async getRulePreview(ruleId: string, authContext: AuthContext): Promise<any> {
    const rule = await this.ruleRepository.findOne({
      where: {
        ruleId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    // Get count of questions matching criteria
    const questionCount = await this.getQuestionCountByCriteria(rule.criteria, authContext);

    return {
      rule,
      metadata: {
        totalQuestionsMatching: questionCount,
        canGeneratePool: questionCount >= rule.poolSize,
        canCreateTest: questionCount >= rule.numberOfQuestions,
        poolSize: rule.poolSize,
        numberOfQuestions: rule.numberOfQuestions,
      },
    };
  }

  async getQuestionsByCriteria(ruleId: string, authContext: AuthContext): Promise<any> {
    const rule = await this.ruleRepository.findOne({
      where: {
        ruleId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    // Get questions matching criteria
    const questions = await this.getQuestionsByCriteriaInternal(rule.criteria, authContext);

    return {
      rule,
      questions,
      totalCount: questions.length,
      canGeneratePool: questions.length >= rule.poolSize,
      canCreateTest: questions.length >= rule.numberOfQuestions,
    };
  }

  private async getQuestionCountByCriteria(criteria: any, authContext: AuthContext): Promise<number> {
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('question.isActive = :isActive', { isActive: true });

    this.applyCriteriaFilters(queryBuilder, criteria);

    return queryBuilder.getCount();
  }

  private async getQuestionsByCriteriaInternal(criteria: any, authContext: AuthContext): Promise<any[]> {
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.options', 'options')
      .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('question.isActive = :isActive', { isActive: true });

    this.applyCriteriaFilters(queryBuilder, criteria);

    return queryBuilder.getMany();
  }

  private applyCriteriaFilters(queryBuilder: any, criteria: any): void {
    if (criteria.categories && criteria.categories.length > 0) {
      queryBuilder.andWhere('question.category IN (:...categories)', { categories: criteria.categories });
    }

    if (criteria.difficultyLevels && criteria.difficultyLevels.length > 0) {
      queryBuilder.andWhere('question.difficultyLevel IN (:...difficultyLevels)', { difficultyLevels: criteria.difficultyLevels });
    }

    if (criteria.questionTypes && criteria.questionTypes.length > 0) {
      queryBuilder.andWhere('question.type IN (:...questionTypes)', { questionTypes: criteria.questionTypes });
    }

    if (criteria.tags && criteria.tags.length > 0) {
      queryBuilder.andWhere('question.tags @> :tags', { tags: criteria.tags });
    }

    if (criteria.marks && criteria.marks.length > 0) {
      queryBuilder.andWhere('question.marks IN (:...marks)', { marks: criteria.marks });
    }

    if (criteria.excludeQuestionIds && criteria.excludeQuestionIds.length > 0) {
      queryBuilder.andWhere('question.questionId NOT IN (:...excludeQuestionIds)', { excludeQuestionIds: criteria.excludeQuestionIds });
    }

    if (criteria.includeQuestionIds && criteria.includeQuestionIds.length > 0) {
      queryBuilder.andWhere('question.questionId IN (:...includeQuestionIds)', { includeQuestionIds: criteria.includeQuestionIds });
    }

    if (criteria.timeRange) {
      queryBuilder.andWhere('question.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: criteria.timeRange.from,
        toDate: criteria.timeRange.to,
      });
    }
  }

  private async validateRuleConfiguration(testId: string, authContext: AuthContext): Promise<void> {
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
      throw new BadRequestException('Cannot modify rules of a published test');
    }

    // Validate based on test type
    switch (test.type) {
      case TestType.PLAIN:
        throw new BadRequestException(
          'Plain tests should not have rules. Please add questions directly to sections.'
        );

      case TestType.RULE_BASED:
        // Rule-based tests can have rules
        // No additional validation needed for rule creation
        break;

      case TestType.GENERATED:
        // Generated tests are created automatically during attempts
        // Should not allow manual rule creation
        throw new BadRequestException('Cannot manually create rules for generated tests. They are created automatically during test attempts.');

      default:
        throw new BadRequestException(`Unsupported test type: ${test.type}`);
    }
  }
} 