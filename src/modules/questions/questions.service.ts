import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Question, QuestionType } from './entities/question.entity';
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
    
    // Validate question data
    this.validateQuestionData(createQuestionDto);
    
    // Validate question options (includes duplicate validation)
    this.validateQuestionOptions(createQuestionDto);
    
    // Validate question parameters
    this.validateQuestionParams(createQuestionDto.type, createQuestionDto.params, createQuestionDto.marks);
    
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

    const { 
      limit = 10, 
      offset = 0, 
      search, 
      status, 
      type, 
      level, 
      categoryId, 
      minMarks, 
      maxMarks, 
      categories,
      difficultyLevels,
      questionTypes,
      tags,
      marks,
      excludeQuestionIds,
      includeQuestionIds,
      timeRangeFrom,
      timeRangeTo,
      rulePreview,
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = queryDto;

    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.options', 'options')
      .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId });

    // Text search
    if (search) {
      queryBuilder.andWhere(
        '(question.text ILIKE :search OR question.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Basic filters
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

    // Rule criteria filters
    if (categories && categories.length > 0) {
      queryBuilder.andWhere('question.categoryId IN (:...categories)', { categories });
    }

    if (difficultyLevels && difficultyLevels.length > 0) {
      queryBuilder.andWhere('question.level IN (:...difficultyLevels)', { difficultyLevels });
    }

    if (questionTypes && questionTypes.length > 0) {
      queryBuilder.andWhere('question.type IN (:...questionTypes)', { questionTypes });
    }

    if (tags && tags.length > 0) {
      // Assuming tags are stored as JSONB array in the question entity
      // If tags are stored differently, adjust this query accordingly
      queryBuilder.andWhere('question.tags @> :tags', { tags: JSON.stringify(tags) });
    }

    if (marks && marks.length > 0) {
      queryBuilder.andWhere('question.marks IN (:...marks)', { marks });
    }

    // Marks range (minMarks and maxMarks take precedence over marks array if both are provided)
    if (minMarks !== undefined || maxMarks !== undefined) {
      if (minMarks !== undefined && maxMarks !== undefined) {
        queryBuilder.andWhere('question.marks BETWEEN :minMarks AND :maxMarks', { minMarks, maxMarks });
      } else if (minMarks !== undefined) {
        queryBuilder.andWhere('question.marks >= :minMarks', { minMarks });
      } else if (maxMarks !== undefined) {
        queryBuilder.andWhere('question.marks <= :maxMarks', { maxMarks });
      }
    }

    // Include/Exclude specific questions
    if (excludeQuestionIds && excludeQuestionIds.length > 0) {
      queryBuilder.andWhere('question.questionId NOT IN (:...excludeQuestionIds)', { excludeQuestionIds });
    }

    if (includeQuestionIds && includeQuestionIds.length > 0) {
      queryBuilder.andWhere('question.questionId IN (:...includeQuestionIds)', { includeQuestionIds });
    }

    // Time range filter
    if (timeRangeFrom || timeRangeTo) {
      if (timeRangeFrom && timeRangeTo) {
        queryBuilder.andWhere('question.createdAt BETWEEN :timeRangeFrom AND :timeRangeTo', {
          timeRangeFrom: new Date(timeRangeFrom),
          timeRangeTo: new Date(timeRangeTo)
        });
      } else if (timeRangeFrom) {
        queryBuilder.andWhere('question.createdAt >= :timeRangeFrom', {
          timeRangeFrom: new Date(timeRangeFrom)
        });
      } else if (timeRangeTo) {
        queryBuilder.andWhere('question.createdAt <= :timeRangeTo', {
          timeRangeTo: new Date(timeRangeTo)
        });
      }
    }

    // Rule preview mode - only show published questions
    if (rulePreview === 'true') {
      queryBuilder.andWhere('question.status = :publishedStatus', { publishedStatus: 'published' });
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
      // Add metadata for rule preview
      ...(rulePreview === 'true' && {
        metadata: {
          totalQuestions: total,
          availableForRules: total,
          rulePreviewMode: true
        }
      })
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

    // Create a merged DTO for validation
    const mergedDto = { ...question, ...updateQuestionDto };
    
    // Validate question data
    this.validateQuestionData(mergedDto);

    // If question type is being updated, validate the new type with options
    if (questionData.type && questionData.type !== question.type) {
      this.validateQuestionOptions(mergedDto);
    } else if (options !== undefined) {
      // If options are being updated but type isn't changing, validate with current type
      const currentQuestionDto = {
        ...mergedDto,
        type: question.type
      };
      this.validateQuestionOptions(currentQuestionDto);
    }

    // Validate question parameters
    this.validateQuestionParams(mergedDto.type, mergedDto.params, mergedDto.marks);

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

  /**
   * Invalidates the question cache for a specific tenant
   * Sets a cache invalidation timestamp that can be checked by cache consumers
   * @param tenantId - The tenant ID for which to invalidate the cache
   */
  private async invalidateQuestionCache(tenantId: string): Promise<void> {
    try {
      // Set a cache invalidation timestamp that can be checked
      await this.cacheManager.set(`question_cache_invalidated:${tenantId}`, Date.now(), 86400);
    } catch (error) {
      // Log error but don't fail the operation
      console.warn('Failed to invalidate question cache:', error);
    }
  }

  async getQuestionsForRulePreview(ruleCriteria: any, authContext: AuthContext) {
    const cacheKey = `rule_preview:${authContext.tenantId}:${JSON.stringify(ruleCriteria)}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.options', 'options')
      .where('question.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('question.organisationId = :organisationId', { organisationId: authContext.organisationId })
      .andWhere('question.status = :status', { status: 'published' });

    // Apply rule criteria
    if (ruleCriteria.categories && ruleCriteria.categories.length > 0) {
      queryBuilder.andWhere('question.categoryId IN (:...categories)', { categories: ruleCriteria.categories });
    }

    if (ruleCriteria.difficultyLevels && ruleCriteria.difficultyLevels.length > 0) {
      queryBuilder.andWhere('question.level IN (:...difficultyLevels)', { difficultyLevels: ruleCriteria.difficultyLevels });
    }

    if (ruleCriteria.questionTypes && ruleCriteria.questionTypes.length > 0) {
      queryBuilder.andWhere('question.type IN (:...questionTypes)', { questionTypes: ruleCriteria.questionTypes });
    }

    if (ruleCriteria.marks && ruleCriteria.marks.length > 0) {
      queryBuilder.andWhere('question.marks IN (:...marks)', { marks: ruleCriteria.marks });
    }

    if (ruleCriteria.tags && ruleCriteria.tags.length > 0) {
      queryBuilder.andWhere('question.tags @> :tags', { tags: JSON.stringify(ruleCriteria.tags) });
    }

    if (ruleCriteria.excludeQuestionIds && ruleCriteria.excludeQuestionIds.length > 0) {
      queryBuilder.andWhere('question.questionId NOT IN (:...excludeQuestionIds)', { excludeQuestionIds: ruleCriteria.excludeQuestionIds });
    }

    if (ruleCriteria.includeQuestionIds && ruleCriteria.includeQuestionIds.length > 0) {
      queryBuilder.andWhere('question.questionId IN (:...includeQuestionIds)', { includeQuestionIds: ruleCriteria.includeQuestionIds });
    }

    if (ruleCriteria.timeRange) {
      queryBuilder.andWhere('question.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: ruleCriteria.timeRange.from,
        toDate: ruleCriteria.timeRange.to,
      });
    }

    const questions = await queryBuilder.getMany();

    // Calculate metadata
    const totalQuestions = questions.length;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const marksDistribution = questions.reduce((acc, q) => {
      acc[q.marks] = (acc[q.marks] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const result = {
      questions,
      metadata: {
        totalQuestions,
        totalMarks,
        marksDistribution,
        averageMarks: totalQuestions > 0 ? (totalMarks / totalQuestions).toFixed(2) : 0,
        questionTypes: questions.reduce((acc, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        difficultyLevels: questions.reduce((acc, q) => {
          acc[q.level] = (acc[q.level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        categories: questions.reduce((acc, q) => {
          if (q.categoryId) {
            acc[q.categoryId] = (acc[q.categoryId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      }
    };

    // Cache for 30 minutes (shorter cache for preview)
    await this.cacheManager.set(cacheKey, result, 1800);

    return result;
  }

  /**
   * Validates question options based on the question type
   * Ensures options meet the requirements for the specific question type
   * Also validates duplicates and partial scoring
   * @param questionDto - The question DTO containing type, options, and marks
   */
  private validateQuestionOptions(questionDto: CreateQuestionDto): void {
    const { type, options, marks: questionMarks } = questionDto;

    // For non-subjective/non-essay questions, options are mandatory
    if (type !== QuestionType.SUBJECTIVE && type !== QuestionType.ESSAY) {
      if (!options || options.length === 0) {
        throw new BadRequestException(`Options are mandatory for question type '${type}'. Please provide at least one option.`);
      }
      
      // Validate that all options have required fields
      this.validateOptionFields(options, questionMarks);
      
      // Validate for duplicate options
      this.validateDuplicateOptionsInternal(questionDto);
      
      // Additional validation for specific question types
      switch (type) {
        case QuestionType.MCQ:
        case QuestionType.TRUE_FALSE: {
          this.validateSingleCorrectAnswer(options, type);
          break;
        }
          
        case QuestionType.MULTIPLE_ANSWER: {
          this.validateMultipleAnswerOptions(options, questionDto);
          break;
        }
          
        case QuestionType.FILL_BLANK: {
          this.validateFillBlankOptions(options, questionDto);
          break;
        }
          
        case QuestionType.MATCH: {
          this.validateMatchOptions(options);
          break;
        }
      }
    }

    // Validate partial scoring
    if (questionDto.allowPartialScoring && options) {
      if (type === QuestionType.MULTIPLE_ANSWER) {
        this.validateMultipleAnswerPartialScoring(options, questionMarks);
      } else if (type === QuestionType.FILL_BLANK) {
        // For fill blank, we need to group options by blankIndex first
        const optionsWithBlankIndex = options.filter(option => option.blankIndex !== undefined);
        const optionsByBlankIndex = this.groupOptionsByBlankIndex(optionsWithBlankIndex);
        this.validateFillBlankPartialScoring(optionsByBlankIndex, questionMarks);
      }
    }
  }

  /**
   * Validates question parameters for specific question types
   * Checks parameter constraints like maxLength > minLength and wordLimit > 0
   * @param type - The question type
   * @param params - Optional parameters object containing validation rules
   * @param marks - Optional question marks for validation
   */
  private validateQuestionParams(type: QuestionType, params?: any, marks?: number): void {
    if (!params) return;

    // Validate maxLength > minLength when both are provided
    if (params.maxLength !== undefined && params.minLength !== undefined) {
      if (params.maxLength <= params.minLength) {
        throw new BadRequestException('maxLength must be greater than minLength.');
      }
    }

    // Validate wordLimit is reasonable
    if (params.wordLimit !== undefined) {
      if (params.wordLimit <= 0) {
        throw new BadRequestException('wordLimit must be greater than 0.');
      }
    }
  }

  /**
   * Validates basic question data including marks and text
   * Performs basic validation of question properties
   * @param createQuestionDto - The question DTO to validate
   */
  private validateQuestionData(createQuestionDto: CreateQuestionDto): void {
    const { marks: questionMarks } = createQuestionDto;

    // Validate question marks are positive if specified
    if (questionMarks !== undefined && questionMarks <= 0) {
      throw new BadRequestException('Question marks must be greater than 0.');
    }

    // Validate question text length
    if (createQuestionDto.text && createQuestionDto.text.trim().length === 0) {
      throw new BadRequestException('Question text cannot be empty.');
    }
  }

  /**
   * Internal method to validate for duplicate options in the question
   * Checks for duplicate option texts and matchWith values for matching questions
   * @param questionDto - The question DTO to validate for duplicates
   */
  private validateDuplicateOptionsInternal(questionDto: CreateQuestionDto): void {
    const { options, type } = questionDto;

    if (!options || options.length === 0) {
      return;
    }

    // Check for duplicate option texts
    this.validateDuplicateTexts(options);

    // For matching questions, check for duplicate matchWith values
    if (type === QuestionType.MATCH) {
      this.validateDuplicateMatchWith(options);
    }
  }

  // Helper methods to reduce duplication
  /**
   * Validates individual option fields for completeness and correctness
   * Ensures each option has required fields and valid values
   * @param options - Array of option objects to validate
   * @param questionMarks - Optional question marks to validate against option marks
   */
  private validateOptionFields(options: any[], questionMarks?: number): void {
    options.forEach((option, index) => {
      if (!option.text || option.text.trim().length === 0) {
        throw new BadRequestException(`Option ${index + 1} must have a non-empty text.`);
      }
      
      // Validate isCorrect is a boolean
      if (typeof option.isCorrect !== 'boolean') {
        throw new BadRequestException(`Option ${index + 1} must have a valid isCorrect boolean value.`);
      }

      // Validate marks are positive if specified
      if (option.marks !== undefined && option.marks <= 0) {
        throw new BadRequestException(`Option ${index + 1} marks must be greater than 0.`);
      }

      // Validate marks don't exceed question marks
      if (option.marks !== undefined && questionMarks !== undefined && option.marks > questionMarks) {
        throw new BadRequestException(`Option ${index + 1} marks (${option.marks}) cannot exceed question marks (${questionMarks}).`);
      }
    });
  }

  /**
   * Validates that single-answer questions have exactly one correct option
   * Applies to MCQ and TRUE_FALSE question types
   * @param options - Array of option objects to validate
   * @param type - The question type for error messaging
   */
  private validateSingleCorrectAnswer(options: any[], type: QuestionType): void {
    const correctOptions = options.filter(option => option.isCorrect);
    if (correctOptions.length !== 1) {
      throw new BadRequestException(`${type} questions must have exactly one correct answer.`);
    }
  }

  /**
   * Validates multiple answer questions have at least one correct option
   * Also validates partial scoring consistency if enabled
   * @param options - Array of option objects to validate
   * @param questionDto - The complete question DTO for validation context
   */
  private validateMultipleAnswerOptions(options: any[], questionDto: CreateQuestionDto): void {
    const correctOptions = options.filter(option => option.isCorrect);
    if (correctOptions.length === 0) {
      throw new BadRequestException('Multiple answer questions must have at least one correct answer.');
    }

    // Validate marks consistency for multiple answer questions
    if (questionDto.allowPartialScoring) {
      this.validateMultipleAnswerPartialScoring(options, questionDto.marks);
    }
  }

  /**
   * Validates partial scoring consistency for multiple answer questions
   * Ensures all correct options have marks and total marks equal question marks
   * @param options - Array of option objects to validate
   * @param questionMarks - The total question marks to validate against
   */
  private validateMultipleAnswerPartialScoring(options: any[], questionMarks?: number): void {
    const correctOptions = options.filter(option => option.isCorrect);
    const optionsWithMarks = correctOptions.filter(option => option.marks !== undefined);
    
    if (optionsWithMarks.length !== correctOptions.length) {
      throw new BadRequestException('All correct options must have marks specified when partial scoring is enabled.');
    }

    const totalOptionMarks = correctOptions.reduce((sum, option) => sum + (option.marks || 0), 0);
    if (questionMarks !== undefined && totalOptionMarks !== questionMarks) {
      throw new BadRequestException(`Sum of option marks (${totalOptionMarks}) must equal question marks (${questionMarks}) when partial scoring is enabled.`);
    }
  }

  /**
   * Validates fill-in-the-blank question options
   * Ensures proper blankIndex structure and correct answer distribution
   * @param options - Array of option objects to validate
   * @param questionDto - The complete question DTO for validation context
   */
  private validateFillBlankOptions(options: any[], questionDto: CreateQuestionDto): void {
    // Fill in the blank questions should have options with blankIndex
    const optionsWithBlankIndex = options.filter(option => option.blankIndex !== undefined);
    if (optionsWithBlankIndex.length === 0) {
      throw new BadRequestException('Fill in the blank questions must have options with blankIndex specified.');
    }
    
    // Validate blankIndex values are sequential and don't have gaps
    this.validateSequentialBlankIndices(optionsWithBlankIndex);

    // Validate each blank has at least one correct answer
    const optionsByBlankIndex = this.groupOptionsByBlankIndex(optionsWithBlankIndex);
    this.validateEachBlankHasCorrectAnswer(optionsByBlankIndex);

    // Additional validation for partial scoring
    if (questionDto.allowPartialScoring && options && options.length > 0) {
      this.validateFillBlankPartialScoring(optionsByBlankIndex, questionDto.marks);
    }
  }

  /**
   * Validates partial scoring consistency for fill-in-the-blank questions
   * Ensures each blank has consistent marks for correct answers and total equals question marks
   * @param optionsByBlankIndex - Map of blank indices to their options
   * @param questionMarks - The total question marks to validate against
   */
  private validateFillBlankPartialScoring(optionsByBlankIndex: Map<number, any[]>, questionMarks?: number): void {
    // Validate each blank has marks specified for correct answers
    for (const [blankIndex, blankOptions] of optionsByBlankIndex) {
      const correctOptions = blankOptions.filter(option => option.isCorrect);

      // Validate marks are specified for correct options
      const optionsWithMarks = correctOptions.filter(option => option.marks !== undefined);
      if (optionsWithMarks.length !== correctOptions.length) {
        throw new BadRequestException(`All correct answers for blank ${blankIndex} must have marks specified when partial scoring is enabled.`);
      }

      // Validate marks are positive
      const invalidMarks = correctOptions.filter(option => option.marks <= 0);
      if (invalidMarks.length > 0) {
        throw new BadRequestException(`All marks for blank ${blankIndex} must be greater than 0 when partial scoring is enabled.`);
      }

      // Validate that all correct options for the same blank have the same marks
      const marks = correctOptions.map(option => option.marks);
      const uniqueMarks = [...new Set(marks)];
      if (uniqueMarks.length > 1) {
        throw new BadRequestException(`All correct answers for blank ${blankIndex} must have the same marks when partial scoring is enabled.`);
      }
    }

    // Calculate total marks from all blanks and validate against question marks
    const totalBlankMarks = this.calculateTotalBlankMarks(optionsByBlankIndex);
    if (questionMarks !== undefined && totalBlankMarks !== questionMarks) {
      throw new BadRequestException(`Sum of blank marks (${totalBlankMarks}) must equal question marks (${questionMarks}) when partial scoring is enabled.`);
    }
  }

  /**
   * Validates that blank indices are sequential starting from 0
   * Ensures no gaps in the blankIndex sequence for fill-in-the-blank questions
   * @param optionsWithBlankIndex - Array of options that have blankIndex defined
   */
  private validateSequentialBlankIndices(optionsWithBlankIndex: any[]): void {
    const blankIndices = optionsWithBlankIndex.map(option => option.blankIndex).sort((a, b) => a - b);
    for (let i = 0; i < blankIndices.length; i++) {
      if (blankIndices[i] !== i) {
        throw new BadRequestException(`Fill in the blank questions must have sequential blankIndex values starting from 0. Found gap at index ${i}.`);
      }
    }
  }

  /**
   * Groups options by their blankIndex for fill-in-the-blank questions
   * Creates a map where keys are blank indices and values are arrays of options
   * @param optionsWithBlankIndex - Array of options that have blankIndex defined
   * @returns Map of blank indices to their corresponding options
   */
  private groupOptionsByBlankIndex(optionsWithBlankIndex: any[]): Map<number, any[]> {
    const optionsByBlankIndex = new Map<number, any[]>();
    optionsWithBlankIndex.forEach(option => {
      if (!optionsByBlankIndex.has(option.blankIndex)) {
        optionsByBlankIndex.set(option.blankIndex, []);
      }
      optionsByBlankIndex.get(option.blankIndex)!.push(option);
    });
    return optionsByBlankIndex;
  }

  /**
   * Validates that each blank has at least one correct answer
   * Ensures fill-in-the-blank questions have valid answer options for each blank
   * @param optionsByBlankIndex - Map of blank indices to their options
   */
  private validateEachBlankHasCorrectAnswer(optionsByBlankIndex: Map<number, any[]>): void {
    for (const [blankIndex, blankOptions] of optionsByBlankIndex) {
      const correctOptions = blankOptions.filter(option => option.isCorrect);
      if (correctOptions.length === 0) {
        throw new BadRequestException(`Blank ${blankIndex} must have at least one correct answer.`);
      }
    }
  }

  /**
   * Calculates the total marks from all blanks in a fill-in-the-blank question
   * Sums up the marks from the first correct option of each blank
   * @param optionsByBlankIndex - Map of blank indices to their options
   * @returns Total marks from all blanks
   */
  private calculateTotalBlankMarks(optionsByBlankIndex: Map<number, any[]>): number {
    let totalBlankMarks = 0;
    for (const [blankIndex, blankOptions] of optionsByBlankIndex) {
      const correctOptions = blankOptions.filter(option => option.isCorrect);
      if (correctOptions.length > 0) {
        totalBlankMarks += correctOptions[0].marks || 0;
      }
    }
    return totalBlankMarks;
  }

  /**
   * Validates matching question options
   * Ensures options have matchWith values and all matchWith options are marked correct
   * @param options - Array of option objects to validate
   */
  private validateMatchOptions(options: any[]): void {
    // Matching questions should have options with matchWith
    const optionsWithMatch = options.filter(option => 
      option.matchWith && 
      option.matchWith.trim().length > 0
    );
    if (optionsWithMatch.length === 0) {
      throw new BadRequestException('Matching questions must have options with matchWith specified.');
    }

    // Validate that all options with matchWith are correct
    const incorrectOptionsWithMatch = optionsWithMatch.filter(option => !option.isCorrect);
    if (incorrectOptionsWithMatch.length > 0) {
      throw new BadRequestException('All options with matchWith must be marked as correct in matching questions.');
    }
  }

  /**
   * Validates that option texts are unique across all options
   * Checks for duplicate option texts (case-insensitive) and throws error if found
   * @param options - Array of option objects to validate for duplicate texts
   */
  private validateDuplicateTexts(options: any[]): void {
    const optionTexts = new Set<string>();
    const duplicateTexts: string[] = [];

    for (const option of options) {
      if (option.text && option.text.trim().length > 0) {
        const normalizedText = option.text.trim().toLowerCase();
        if (optionTexts.has(normalizedText)) {
          duplicateTexts.push(option.text.trim());
        } else {
          optionTexts.add(normalizedText);
        }
      }
    }

    if (duplicateTexts.length > 0) {
      throw new BadRequestException(`Duplicate option texts found: ${duplicateTexts.join(', ')}`);
    }
  }

  /**
   * Validates that matchWith values are unique for matching questions
   * Checks for duplicate matchWith values (case-insensitive) and throws error if found
   * @param options - Array of option objects to validate for duplicate matchWith values
   */
  private validateDuplicateMatchWith(options: any[]): void {
    const matchWithValues = new Set<string>();
    const duplicateMatchWith: string[] = [];

    for (const option of options) {
      if (option.matchWith && option.matchWith.trim().length > 0) {
        const normalizedMatchWith = option.matchWith.trim().toLowerCase();
        if (matchWithValues.has(normalizedMatchWith)) {
          duplicateMatchWith.push(option.matchWith.trim());
        } else {
          matchWithValues.add(normalizedMatchWith);
        }
      }
    }

    if (duplicateMatchWith.length > 0) {
      throw new BadRequestException(`Duplicate matchWith values found: ${duplicateMatchWith.join(', ')}`);
    }
  }
} 