import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionPool } from './entities/question-pool.entity';
import { TestRule } from './entities/test-rule.entity';
import { Question } from '../questions/entities/question.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';

@Injectable()
export class QuestionPoolService {
  constructor(
    @InjectRepository(QuestionPool)
    private readonly questionPoolRepository: Repository<QuestionPool>,
    @InjectRepository(TestRule)
    private readonly testRuleRepository: Repository<TestRule>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async generateQuestionPool(ruleId: string, authContext: AuthContext): Promise<QuestionPool> {
    const rule = await this.testRuleRepository.findOne({
      where: {
        id: ruleId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        isActive: true,
      },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found or inactive');
    }

    // Find questions based on rule criteria
    const questions = await this.findQuestionsByCriteria(rule.criteria, authContext);

    if (questions.length < rule.numberOfQuestions) {
      throw new Error(`Not enough questions available. Found ${questions.length}, required ${rule.numberOfQuestions}`);
    }

    // Select questions based on strategy
    const selectedQuestions = this.selectQuestions(questions, rule.numberOfQuestions, rule.selectionStrategy);

    // Calculate total marks
    const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

    // Create question pool
    const questionPool = this.questionPoolRepository.create({
      testId: rule.testId,
      sectionId: rule.sectionId,
      ruleId: rule.id,
      name: `Pool for ${rule.name}`,
      description: `Generated from rule: ${rule.name}`,
      questionIds: selectedQuestions.map(q => q.id),
      totalQuestions: selectedQuestions.length,
      totalMarks,
      isActive: true,
      generatedAt: new Date(),
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
      createdBy: authContext.userId,
    });

    return this.questionPoolRepository.save(questionPool);
  }

  async getQuestionPool(poolId: string, authContext: AuthContext): Promise<QuestionPool> {
    const pool = await this.questionPoolRepository.findOne({
      where: {
        id: poolId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        isActive: true,
      },
    });

    if (!pool) {
      throw new NotFoundException('Question pool not found');
    }

    return pool;
  }

  async getQuestionsForPool(poolId: string, authContext: AuthContext): Promise<Question[]> {
    const pool = await this.getQuestionPool(poolId, authContext);
    
    return this.questionRepository.find({
      where: {
        id: { $in: pool.questionIds } as any,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['options'],
      order: { ordering: 'ASC' },
    });
  }

  private async findQuestionsByCriteria(criteria: any, authContext: AuthContext): Promise<Question[]> {
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('question.status = :status', { status: 'published' });

    if (criteria.categories && criteria.categories.length > 0) {
      queryBuilder.andWhere('question.categoryId IN (:...categories)', { categories: criteria.categories });
    }

    if (criteria.difficultyLevels && criteria.difficultyLevels.length > 0) {
      queryBuilder.andWhere('question.level IN (:...difficultyLevels)', { difficultyLevels: criteria.difficultyLevels });
    }

    if (criteria.questionTypes && criteria.questionTypes.length > 0) {
      queryBuilder.andWhere('question.type IN (:...questionTypes)', { questionTypes: criteria.questionTypes });
    }

    if (criteria.excludeQuestionIds && criteria.excludeQuestionIds.length > 0) {
      queryBuilder.andWhere('question.id NOT IN (:...excludeQuestionIds)', { excludeQuestionIds: criteria.excludeQuestionIds });
    }

    if (criteria.includeQuestionIds && criteria.includeQuestionIds.length > 0) {
      queryBuilder.andWhere('question.id IN (:...includeQuestionIds)', { includeQuestionIds: criteria.includeQuestionIds });
    }

    if (criteria.timeRange) {
      queryBuilder.andWhere('question.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: criteria.timeRange.from,
        toDate: criteria.timeRange.to,
      });
    }

    return queryBuilder.getMany();
  }

  private selectQuestions(questions: Question[], count: number, strategy: string): Question[] {
    switch (strategy) {
      case 'random':
        return this.shuffleArray([...questions]).slice(0, count);
      case 'sequential':
        return questions.slice(0, count);
      case 'weighted':
        return this.selectWeightedQuestions(questions, count);
      default:
        return this.shuffleArray([...questions]).slice(0, count);
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

  private selectWeightedQuestions(questions: Question[], count: number): Question[] {
    // Simple weighted selection based on question marks
    const weightedQuestions = questions.map(q => ({
      question: q,
      weight: q.marks,
    }));

    weightedQuestions.sort((a, b) => b.weight - a.weight);
    return weightedQuestions.slice(0, count).map(wq => wq.question);
  }
} 