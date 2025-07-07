import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestQuestion } from './entities/test-question.entity';
import { TestRule } from './entities/test-rule.entity';
import { Question } from '../questions/entities/question.entity';
import { AuthContext } from '@/common/interfaces/auth.interface';

@Injectable()
export class QuestionPoolService {
  constructor(
    @InjectRepository(TestQuestion)
    private readonly testQuestionRepository: Repository<TestQuestion>,
    @InjectRepository(TestRule)
    private readonly testRuleRepository: Repository<TestRule>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async generateQuestionPool(ruleId: string, authContext: AuthContext): Promise<any> {
    const rule = await this.testRuleRepository.findOne({
      where: {
        ruleId: ruleId,
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
    return selectedQuestions;
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