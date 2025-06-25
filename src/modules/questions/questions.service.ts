import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly questionOptionRepository: Repository<QuestionOption>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createQuestionDto: CreateQuestionDto, authContext: AuthContext): Promise<Question> {
    const { options, ...questionData } = createQuestionDto;
    
    const question = this.questionRepository.create({
      ...questionData,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
      createdBy: authContext.userId,
    });

    const savedQuestion = await this.questionRepository.save(question);

    // Create options if provided
    if (options && options.length > 0) {
      const questionOptions = options.map(optionData => 
        this.questionOptionRepository.create({
          ...optionData,
          questionId: savedQuestion.questionId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        })
      );
      
      await this.questionOptionRepository.save(questionOptions);
    }

    // Invalidate cache
    await this.invalidateQuestionCache(authContext.tenantId);
    
    return this.findOne(savedQuestion.questionId, authContext);
  }

  async findAll(queryDto: QueryQuestionDto, authContext: AuthContext) {
    const cacheKey = `questions:${authContext.tenantId}:${JSON.stringify(queryDto)}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { limit = 10, offset = 0, search, status, type, level, categoryId, minMarks, maxMarks, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;

    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.options', 'options')
      .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId });

    if (search) {
      queryBuilder.andWhere(
        '(question.title ILIKE :search OR question.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('question.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('question.type = :type', { type });
    }

    if (level) {
      queryBuilder.andWhere('question.level = :level', { level });
    }

    if (categoryId) {
      queryBuilder.andWhere('question.categoryId = :categoryId', { categoryId });
    }

    if (minMarks !== undefined || maxMarks !== undefined) {
      if (minMarks !== undefined && maxMarks !== undefined) {
        queryBuilder.andWhere('question.marks BETWEEN :minMarks AND :maxMarks', { minMarks, maxMarks });
      } else if (minMarks !== undefined) {
        queryBuilder.andWhere('question.marks >= :minMarks', { minMarks });
      } else if (maxMarks !== undefined) {
        queryBuilder.andWhere('question.marks <= :maxMarks', { maxMarks });
      }
    }

    const total = await queryBuilder.getCount();

    queryBuilder
      .orderBy(`question.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip(offset)
      .take(limit);

    const questions = await queryBuilder.getMany();

    const result = {
      content: questions,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1,
      size: limit,
    };

    // Cache for 1 day
    await this.cacheManager.set(cacheKey, result, 86400);

    return result;
  }

  async findOne(id: string, authContext: AuthContext): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: {
        questionId: id,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['options'],
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto, authContext: AuthContext): Promise<Question> {
    const question = await this.findOne(id, authContext);
    const { options, ...questionData } = updateQuestionDto;

    Object.assign(question, {
      ...questionData,
      updatedBy: authContext.userId,
    });

    const updatedQuestion = await this.questionRepository.save(question);

    // Update options if provided
    if (options) {
      // Remove existing options
      await this.questionOptionRepository.delete({ questionId: id });
      
      // Create new options
      if (options.length > 0) {
        const questionOptions = options.map(optionData => 
          this.questionOptionRepository.create({
            ...optionData,
            questionId: id,
            tenantId: authContext.tenantId,
            organisationId: authContext.organisationId,
          })
        );
        
        await this.questionOptionRepository.save(questionOptions);
      }
    }

    // Invalidate cache
    await this.invalidateQuestionCache(authContext.tenantId);
    
    return this.findOne(id, authContext);
  }

  async remove(id: string, authContext: AuthContext): Promise<void> {
    const question = await this.findOne(id, authContext);
    
    // Remove options first
    await this.questionOptionRepository.delete({ questionId: id });
    
    // Remove question
    await this.questionRepository.remove(question);
    
    // Invalidate cache
    await this.invalidateQuestionCache(authContext.tenantId);
  }

  private async invalidateQuestionCache(tenantId: string): Promise<void> {
    try {
      // Set a cache invalidation timestamp that can be checked
      await this.cacheManager.set(`question_cache_invalidated:${tenantId}`, Date.now(), 86400);
    } catch (error) {
      // Log error but don't fail the operation
      console.warn('Failed to invalidate question cache:', error);
    }
  }
} 