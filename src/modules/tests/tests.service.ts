import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Like, Between, In, Not, FindOptionsWhere, DataSource, IsNull } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Test } from './entities/test.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestDto } from './dto/query-test.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { TestStatus, TestType, AttemptsGradeMethod } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestSection } from './entities/test-section.entity';
import { Question, QuestionType } from '../questions/entities/question.entity';
import { OptionQuestion } from '../questions/entities/option-question.entity';
import { HelperUtil } from '@/common/utils/helper.util';
import { UserTestStatusDto } from './dto/user-test-status.dto';
import { TestAttempt, AttemptStatus, ReviewStatus } from './entities/test-attempt.entity';
import { OrderingService } from '@/common/services/ordering.service';
import { RESPONSE_MESSAGES } from '@/common/constants/response-messages.constant';
import { TestStructureDto } from './dto/test-structure.dto';
import { TestRule } from './entities/test-rule.entity';
import { ResultType } from './entities/test-attempt.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TestsService {
  private readonly logger = new Logger(TestsService.name);

  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(TestQuestion)
    private readonly testQuestionRepository: Repository<TestQuestion>,
    @InjectRepository(TestSection)
    private readonly testSectionRepository: Repository<TestSection>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(OptionQuestion)
    private readonly optionQuestionRepository: Repository<OptionQuestion>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepository: Repository<TestAttempt>,
    @InjectRepository(TestRule)
    private readonly testRuleRepository: Repository<TestRule>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly orderingService: OrderingService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Common logic for fetching test hierarchy data
   * @param id - Test ID
   * @param authContext - Authentication context
   * @returns Promise<{test: Test, testQuestions: TestQuestion[], questionsMap: Map<string, Question>, childQuestionsByParent: Map<string, Question[]>}>
   */
  private async fetchTestHierarchyData(id: string, authContext: AuthContext) {
    // First, get the test with sections
    const test = await this.testRepository.findOne({
      where: {
        testId: id,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        status: Not(TestStatus.ARCHIVED)
      },
      relations: ['sections'],
      order: {
        sections: {
          ordering: 'ASC',
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Then, get test questions with explicit field selection
    const testQuestions = await this.testQuestionRepository.find({
      where: {
        testId: id,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      select: [
        'testQuestionId',
        'tenantId',
        'organisationId',
        'testId',
        'questionId',
        'ordering',
        'sectionId',
        'ruleId',
        'isCompulsory',
        'isConditional'
      ],
      order: { ordering: 'ASC' },
    });

    // Group test questions by section, filtering out conditional questions
    const questionsBySection = new Map<string, any[]>();
    testQuestions
      .filter(tq => !tq.isConditional) // Filter out conditional questions
      .forEach(tq => {
        if (!questionsBySection.has(tq.sectionId)) {
          questionsBySection.set(tq.sectionId, []);
        }
        questionsBySection.get(tq.sectionId)!.push(tq);
      });

    // Attach filtered test questions to sections
    test.sections.forEach(section => {
      section.questions = questionsBySection.get(section.sectionId) || [];
    });

    // Extract question IDs from test questions, filtering out conditional questions
    const questionIds = testQuestions
      .filter(testQuestion => !testQuestion.isConditional) // Filter out conditional questions
      .map(testQuestion => testQuestion.questionId);

    if (questionIds.length === 0) {
      return { test, testQuestions, questionsMap: new Map(), childQuestionsByParent: new Map() };
    }

    // Fetch only parent questions (non-conditional) with options
    const questions = await this.questionRepository.find({
      where: { 
        questionId: In(questionIds),
        parentId: IsNull() // Only fetch parent questions
      },
      relations: ['options'],
      order: {
        options: {
          ordering: 'ASC',
        },
      },
    });

    // Create a map for quick lookup
    const questionsMap = new Map(questions.map(q => [q.questionId, q]));

    // Fetch all child questions for conditional display
    const childQuestions = await this.questionRepository.find({
      where: { 
        parentId: Not(IsNull()) // Only fetch child questions
      },
      relations: ['options'],
      order: {
        options: {
          ordering: 'ASC',
        },
      },
    });
    
    // Create a map of child questions by parent ID
    const childQuestionsByParent = new Map<string, any[]>();
    childQuestions.forEach(child => {
      if (!childQuestionsByParent.has(child.parentId!)) {
        childQuestionsByParent.set(child.parentId!, []);
      }
      childQuestionsByParent.get(child.parentId!)!.push(child);
    });

    return { test, testQuestions, questionsMap, childQuestionsByParent };
  }

  /**
   * Common logic for transforming and attaching questions to test hierarchy
   * @param test - Test object with sections
   * @param questionsMap - Map of questions by ID
   * @param childQuestionsByParent - Map of child questions by parent ID
   * @param showCorrectOptions - Whether to show correct options
   * @param authContext - Authentication context
   * @param transformMethod - Method to use for transformation
   */
  private async transformAndAttachQuestions(
    test: Test,
    questionsMap: Map<string, Question>,
    childQuestionsByParent: Map<string, Question[]>,
    showCorrectOptions: boolean,
    authContext: AuthContext,
    transformMethod: (question: Question, showCorrectOptions: boolean, authContext: AuthContext, childQuestionsByParent: Map<string, Question[]>) => Promise<any>
  ) {
    // Transform questions and attach to test questions
    for (const section of test.sections) {
      for (const testQuestion of section.questions) {
        // Skip conditional questions as they should not appear in main structure
        if (testQuestion.isConditional) {
          continue;
        }
        
        const question = questionsMap.get(testQuestion.questionId);
        if (question) {

          // Transform the question data with conditional child questions
          const transformedQuestion = await transformMethod(
            question, 
            showCorrectOptions, 
            authContext,
            childQuestionsByParent
          );

          // For matching questions, add a separate array of matchWith options
          if (question.type === QuestionType.MATCH && question.options?.length > 0) {
            const matchWithOptions = question.options
              .filter(opt => opt.matchWith) // Only include options that have matchWith
              .map(opt => ({
                matchWith: opt.matchWith,
                matchWithMedia: opt.matchWithMedia,
                ordering: opt.ordering,
              }))
              .sort((a, b) => a.ordering - b.ordering); // Sort by ordering

            (transformedQuestion as any).matchWithOptions = matchWithOptions;
          }

          // Replace the test question with the complete question data
          Object.assign(testQuestion, transformedQuestion);
        }
      }
    }
  }

  async create(createTestDto: CreateTestDto, authContext: AuthContext): Promise<Test> {
   
     // Generate a simple alias from the title if none provided
     if (!createTestDto.alias) {
      createTestDto.alias = await HelperUtil.generateUniqueAliasWithRepo(
        createTestDto.title,
        this.testRepository,
        authContext.tenantId,
        authContext.organisationId,
      );
    } else {
      // Check if the alias already exists
      const existingTest = await this.testRepository.findOne({
        where: { 
          alias: createTestDto.alias, 
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
          status: Not(TestStatus.ARCHIVED)
        } as FindOptionsWhere<Test>,
      });

      if (existingTest) {
        const originalAlias = createTestDto.alias;
        createTestDto.alias = await HelperUtil.generateUniqueAliasWithRepo(
          originalAlias,
          this.testRepository,
          authContext.tenantId,
          authContext.organisationId,
        );
      }
    }

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
        status: Not(TestStatus.ARCHIVED)
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
    
    // Check if test has any attempts
    await this.validateNoAttempts(id, authContext);
    
    await this.testQuestionRepository.delete({
      testId: id,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    });

    if (isHardDelete) {
      // Hard delete: Remove all sections and test questions first
      await this.testSectionRepository.delete({
        testId: id,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      });
      // Then remove the test
      await this.testRepository.remove(test);
    } else {
      // Soft delete: Archive the test and all its sections
      await this.testRepository.update(id, { status: TestStatus.ARCHIVED });
      
      // Archive all sections of this test
      await this.testSectionRepository.update(
        { testId: id, tenantId: authContext.tenantId, organisationId: authContext.organisationId },
        { status: TestStatus.ARCHIVED }
      );
    }
    
    // Invalidate cache
    await this.invalidateTestCache(authContext.tenantId);
  }

  /**
   * Validates that a test has no attempts before allowing deletion
   * @param testId - The test ID to check
   * @param authContext - Authentication context
   * @throws BadRequestException if test has attempts
   */
  private async validateNoAttempts(testId: string, authContext: AuthContext): Promise<void> {
    const attempt = await this.testAttemptRepository.findOne({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (attempt) {
      throw new BadRequestException('Cannot delete test that has attempts. Archive the test instead.');
    }
  }

  // Learner view

  async getTestHierarchy(id: string, showCorrectOptions: boolean, authContext: AuthContext) {
    // Fetch common test hierarchy data
    const { test, questionsMap, childQuestionsByParent } = await this.fetchTestHierarchyData(id, authContext);

    // Transform and attach questions using learner transformation method
    await this.transformAndAttachQuestions(
      test,
      questionsMap,
      childQuestionsByParent,
      showCorrectOptions,
      authContext,
      this.transformQuestionWithConditionals.bind(this)
    );

    return test;
  }

  // Admin view
  async getTestHierarchyAdmin(id: string, showCorrectOptions: boolean, authContext: AuthContext) {
    // Fetch common test hierarchy data
    const { test, questionsMap, childQuestionsByParent } = await this.fetchTestHierarchyData(id, authContext);

    // Transform and attach questions using admin transformation method
    await this.transformAndAttachQuestions(
      test,
      questionsMap,
      childQuestionsByParent,
      showCorrectOptions,
      authContext,
      this.transformQuestionWithConditionalsAdmin.bind(this)
    );

    return test;
  }

  /**
   * Transforms a question with its conditional child questions in a nested structure
   * @param question - The question to transform
   * @param showCorrectOptions - Whether to show correct options
   * @param authContext - Authentication context
   * @param childQuestionsByParent - Map of child questions by parent ID
   * @returns Transformed question with conditional structure
   */
  private async transformQuestionWithConditionals(
    question: any, 
    showCorrectOptions: boolean, 
    authContext: AuthContext,
    childQuestionsByParent: Map<string, any[]>
  ): Promise<any> {
    const transformedQuestion = {
      questionId: question.questionId,
      text: question.text,
      type: question.type,
      marks: question.marks,
      params: question.params,
      status: question.status,
      ordering: question.ordering,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      options: await this.transformOptionsWithConditionals(
        question.options || [], 
        showCorrectOptions, 
        authContext,
        childQuestionsByParent,
        question.questionId
      )
    };

    return transformedQuestion;
  }

  /**
   * Transforms options with their conditional child questions
   * @param options - Array of options to transform
   * @param showCorrectOptions - Whether to show correct options
   * @param authContext - Authentication context
   * @param childQuestionsByParent - Map of child questions by parent ID
   * @param parentQuestionId - ID of the parent question
   * @returns Transformed options with conditional structure
   */
  private async transformOptionsWithConditionals(
    options: any[], 
    showCorrectOptions: boolean, 
    authContext: AuthContext,
    childQuestionsByParent: Map<string, any[]>,
    parentQuestionId: string
  ): Promise<any[]> {
    // Get option-question mappings for this parent question
    const optionQuestionMappings = await this.optionQuestionRepository.find({
      where: {
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        option: {
          questionId: parentQuestionId
        }
      },
      relations: ['question', 'question.options', 'option']
    });

    // Create a map of optionId -> child question for quick lookup
    const optionToChildQuestionMap = new Map<string, any>();
    optionQuestionMappings.forEach(mapping => {
      optionToChildQuestionMap.set(mapping.optionId, mapping.question);
    });

    return Promise.all(options.map(async (option) => {
      const transformedOption: any = {
        questionOptionId: option.questionOptionId,
        text: option.text,
        media: option.media,
        ordering: option.ordering,
        marks: option.marks,
        caseSensitive: option.caseSensitive,
        createdAt: option.createdAt,
        // Conditionally include sensitive fields based on showCorrectOptions parameter
        ...(showCorrectOptions && { 
          isCorrect: option.isCorrect,
          blankIndex: option.blankIndex,
          matchWith: option.matchWith,
          matchWithMedia: option.matchWithMedia
        }),
      };

      // Check if this specific option has a conditional child question
      const childQuestion = optionToChildQuestionMap.get(option.questionOptionId);
      
      if (childQuestion) {
        transformedOption.hasChildQuestion = true;
        
        // Recursively transform the child question
        transformedOption.childQuestion = await this.transformQuestionWithConditionals(
          childQuestion, 
          showCorrectOptions, 
          authContext,
          childQuestionsByParent
        );
      } else {
        transformedOption.hasChildQuestion = false;
      }

      return transformedOption;
    }));
  }

  /**
   * Transforms questions with conditional child questions for admin view (includes child questions)
   * @param question - Question to transform
   * @param showCorrectOptions - Whether to show correct options
   * @param authContext - Authentication context
   * @param childQuestionsByParent - Map of child questions by parent ID
   * @returns Transformed question with conditional structure including child questions
   */
  private async transformQuestionWithConditionalsAdmin(
    question: any, 
    showCorrectOptions: boolean, 
    authContext: AuthContext,
    childQuestionsByParent: Map<string, any[]>
  ): Promise<any> {
    const transformedQuestion: any = {
      questionId: question.questionId,
      text: question.text,
      type: question.type,
      marks: question.marks,
      params: question.params,
      status: question.status,
      ordering: question.ordering,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      options: await this.transformOptionsWithConditionalsAdmin(
        question.options || [], 
        showCorrectOptions, 
        authContext,
        childQuestionsByParent,
        question.questionId
      )
    };

    // Add childQuestion array for admin view
    const childQuestions = childQuestionsByParent.get(question.questionId) || [];
    if (childQuestions.length > 0) {
      transformedQuestion.childQuestion = await Promise.all(
        childQuestions.map(async (childQuestion) => {
          return await this.transformQuestionWithConditionalsAdmin(
            childQuestion,
            showCorrectOptions,
            authContext,
            childQuestionsByParent
          );
        })
      );
    }

    return transformedQuestion;
  }

  /**
   * Transforms options with their conditional child questions for admin view (includes AssociatedQuestion array)
   * @param options - Array of options to transform
   * @param showCorrectOptions - Whether to show correct options
   * @param authContext - Authentication context
   * @param childQuestionsByParent - Map of child questions by parent ID
   * @param parentQuestionId - ID of the parent question
   * @returns Transformed options with conditional structure including AssociatedQuestion array
   */
  private async transformOptionsWithConditionalsAdmin(
    options: any[], 
    showCorrectOptions: boolean, 
    authContext: AuthContext,
    childQuestionsByParent: Map<string, any[]>,
    parentQuestionId: string
  ): Promise<any[]> {
    // Get option-question mappings for this parent question
    const optionQuestionMappings = await this.optionQuestionRepository.find({
      where: {
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        option: {
          questionId: parentQuestionId
        }
      },
      relations: ['question', 'question.options', 'option']
    });

    // Create a map of optionId -> child questions array for quick lookup
    const optionToChildQuestionMap = new Map<string, any[]>();
    optionQuestionMappings.forEach(mapping => {
      if (!optionToChildQuestionMap.has(mapping.optionId)) {
        optionToChildQuestionMap.set(mapping.optionId, []);
      }
      optionToChildQuestionMap.get(mapping.optionId)!.push(mapping.question);
    });

    return Promise.all(options.map(async (option) => {
      const transformedOption: any = {
        questionOptionId: option.questionOptionId,
        text: option.text,
        media: option.media,
        ordering: option.ordering,
        marks: option.marks,
        caseSensitive: option.caseSensitive,
        createdAt: option.createdAt,
        // Conditionally include sensitive fields based on showCorrectOptions parameter
        ...(showCorrectOptions && { 
          isCorrect: option.isCorrect,
          blankIndex: option.blankIndex,
          matchWith: option.matchWith,
          matchWithMedia: option.matchWithMedia
        }),
      };

      // Check if this specific option has conditional child questions
      const childQuestions = optionToChildQuestionMap.get(option.questionOptionId);
      
      if (childQuestions && childQuestions.length > 0) {
        transformedOption.hasChildQuestion = true;
        
        // Add AssociatedQuestion array for this option (without options)
        transformedOption.AssociatedQuestion = childQuestions.map(childQuestion => 
          this.transformQuestionWithoutOptions(childQuestion)
        );
      } else {
        transformedOption.hasChildQuestion = false;
      }

      return transformedOption;
    }));
  }

  /**
   * Transforms a question without options (for AssociatedQuestion)
   * @param question - Question to transform
   * @returns Transformed question without options
   */
  private transformQuestionWithoutOptions(question: any): any {
    return {
      questionId: question.questionId,
      text: question.text,
      type: question.type,
      marks: question.marks,
      params: question.params,
      status: question.status,
      ordering: question.ordering,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
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
    const isTestObjective = await this.checkIfTestIsObjective(testId, authContext);

    let isObjective = false;
    if(isTestObjective) {
      isObjective = true;
    }

    await this.testRepository.update(testId, { isObjective });

    
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
    const questionsToAdd: Array<{
      testId: string;
      sectionId: string;
      questionId: string;
      ordering: number;
      isCompulsory: boolean;
      tenantId: string;
      organisationId: string;
    }> = [];
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

    const isTestObjective = await this.checkIfTestIsObjective(testId, authContext);
    let isObjective = false;
    if(isTestObjective){
      isObjective = true;
    }

    await this.testRepository.update(testId, { isObjective });

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

  private async validateQuestionAddition(testId: string, authContext: AuthContext): Promise<void> {
    // Get the test to check its type
    const test = await this.testRepository.findOne({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        status: Not(TestStatus.ARCHIVED)
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
        status: Not(TestStatus.ARCHIVED)
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const maxAttempts = test.attempts;

    // Get total attempts count
    const totalAttempts = await this.getTotalAttempts(testId, userId, authContext);
   
    // Get graded attempt based on grading method
    let finalScore: number = 0;
    let finalResult: ResultType | null = null;
    let finalAttemptId: string | null = null;
    let gradedAttemptData: TestAttempt | null = null;

    switch (test.attemptsGrading) {
      case AttemptsGradeMethod.FIRST_ATTEMPT: {
        gradedAttemptData = await this.getFirstAttempt(testId, userId, authContext, test);
        if (gradedAttemptData) {
          finalScore = gradedAttemptData.score || 0;
          finalResult = gradedAttemptData.result || null;
          finalAttemptId = gradedAttemptData.attemptId;
        }
        break;
      }

      case AttemptsGradeMethod.LAST_ATTEMPT: {
        gradedAttemptData = await this.getLastCompletedAttempt(testId, userId, authContext, test);
        if (gradedAttemptData) {
          finalScore = gradedAttemptData.score || 0;
          finalResult = gradedAttemptData.result || null;
          finalAttemptId = gradedAttemptData.attemptId;
        }
        break;
      }

      case AttemptsGradeMethod.HIGHEST: {
        gradedAttemptData = await this.getHighestAttempt(testId, userId, authContext, test);
        if (gradedAttemptData) {
          finalScore = gradedAttemptData.score || 0;
          finalResult = gradedAttemptData.result || null;
          finalAttemptId = gradedAttemptData.attemptId;
        }
        break;
      }

      case AttemptsGradeMethod.AVERAGE: {
        const averageData = await this.getAverageScore(testId, userId, authContext, test);
        if (averageData) {
          finalScore = averageData.averageScore;
          finalResult = finalScore >= test.passingMarks ? ResultType.PASS : ResultType.FAIL; // PASS or FAIL
          
          // Get the last submitted attempt for attemptId reference
          const lastSubmittedAttempt = await this.getLastCompletedAttempt(testId, userId, authContext, test);
          if (lastSubmittedAttempt) {
            finalAttemptId = lastSubmittedAttempt.attemptId;
            gradedAttemptData = lastSubmittedAttempt; // Use for graded attempt object
          }
        }
        break;
      }
    }

    // Get last attempt for resume check (lightweight query)
    const lastAttempt = await this.getLastAttemptForResume(test, userId, authContext);
    
    // Handle allowResubmission logic
    let canAttempt: boolean;
    let canResume: boolean;
    
    if (test.allowResubmission) {
      // For tests with allowResubmission, user can always attempt (only one attempt allowed)
      canAttempt = totalAttempts === 0;
      // Can resume if there's an existing attempt (in progress or submitted)
      canResume = lastAttempt !== null;
    } else {
      // Original logic for tests without allowResubmission
      canAttempt = totalAttempts < maxAttempts;
      canResume = lastAttempt?.status === AttemptStatus.IN_PROGRESS;
    }

    // Build graded attempt object
    let gradedAttempt: {
      attemptId: string;
      status: AttemptStatus;
      score: number;
      result: ResultType | null;
      submittedAt: Date;
    } | null = null;
    if (gradedAttemptData && finalAttemptId) {
      gradedAttempt = {
        attemptId: gradedAttemptData.attemptId,
        status: gradedAttemptData.status,
        score: finalScore,
        result: finalResult,
        submittedAt: gradedAttemptData.submittedAt,
      };
    }

    // Build last attempt object
    let lastAttemptInfo: {
      attemptId: string;
      status: AttemptStatus;
      resumeAllowed: boolean;
    } | null = null;
    if (lastAttempt) {
      lastAttemptInfo = {
        attemptId: lastAttempt.attemptId,
        status: lastAttempt.status,
        resumeAllowed: canResume,
      };
    }

    return {
      testId,
      totalAttemptsAllowed: maxAttempts,
      attemptsMade: totalAttempts,
      canAttempt,
      canResume,
      attemptGrading: test.attemptsGrading,
      gradedAttempt,
      lastAttempt: lastAttemptInfo,
      showCorrectAnswers: test.showCorrectAnswer,
    };
  }

  /**
   * Retrieves the first submitted attempt for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @param test - The test object to check if it's objective
   * @returns Promise<TestAttempt | null> - The first submitted attempt or null if none exists
   */
  private async getFirstAttempt(testId: string, userId: string, authContext: AuthContext, test: Test): Promise<TestAttempt | null> {
    const where: any = {
      testId,
      userId,
      status: AttemptStatus.SUBMITTED,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    };

    if (!test.isObjective) {
      where.reviewStatus = ReviewStatus.REVIEWED;
    }

    return await this.testAttemptRepository.findOne({
      where,
      order: { attempt: 'ASC' },
    });
  }

  /**
   * Retrieves the last submitted attempt for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @param test - The test object to check if it's objective
   * @returns Promise<TestAttempt | null> - The last submitted attempt or null if none exists
   */
  private async getLastCompletedAttempt(testId: string, userId: string, authContext: AuthContext, test: Test): Promise<TestAttempt | null> {
    const where: any = {
      testId,
      userId,
      status: AttemptStatus.SUBMITTED,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    };

    if (!test.isObjective) {
      where.reviewStatus = ReviewStatus.REVIEWED;
    }

    return await this.testAttemptRepository.findOne({
      where,
      order: { attempt: 'DESC' },
    });
  }

  /**
   * Retrieves the attempt with the highest score for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @param test - The test object to check if it's objective
   * @returns Promise<TestAttempt | null> - The highest scoring attempt or null if none exists
   */
  private async getHighestAttempt(testId: string, userId: string, authContext: AuthContext, test: Test): Promise<TestAttempt | null> {
    const where: any = {
      testId,
      userId,
      status: AttemptStatus.SUBMITTED,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    };

    if (!test.isObjective) {
      where.reviewStatus = ReviewStatus.REVIEWED;
    }

    return await this.testAttemptRepository.findOne({
      where,
      order: { score: 'DESC' },
    });
  }

  /**
   * Calculates the average score across all submitted attempts for a user and test.
   * Uses database aggregation for optimal performance instead of fetching all attempts.
   * Handles null scores by treating them as 0 using COALESCE.
   * 
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @param test - The test object to check if it's objective
   * @returns Promise<{averageScore: number, attemptCount: number, lastAttemptDate: Date | null} | null> - 
   *          Aggregated score data or null if no submitted attempts exist
   */
  private async getAverageScore(testId: string, userId: string, authContext: AuthContext, test: Test): Promise<{ averageScore: number; attemptCount: number; lastAttemptDate: Date | null } | null> {
    const queryBuilder = this.testAttemptRepository
      .createQueryBuilder('attempt')
      .select([
        'AVG(COALESCE(attempt.score, 0)) as averageScore',
        'COUNT(*) as attemptCount',
        'MAX(attempt.startedAt) as lastAttemptDate'
      ])
      .where('attempt.testId = :testId', { testId })
      .andWhere('attempt.userId = :userId', { userId })
      .andWhere('attempt.status = :status', { status: AttemptStatus.SUBMITTED })
      .andWhere('attempt.tenantId = :tenantId', { tenantId: authContext.tenantId })
      .andWhere('attempt.organisationId = :organisationId', { organisationId: authContext.organisationId });

    if (!test.isObjective) {
      queryBuilder.andWhere('attempt.reviewStatus = :reviewStatus', { reviewStatus: ReviewStatus.REVIEWED });
    }

    const result = await queryBuilder.getRawOne();

    if (!result || result.attemptCount === '0') {
      return null;
    }

    return {
      averageScore: parseFloat(result.averageScore) || 0,
      attemptCount: parseInt(result.attemptCount) || 0,
      lastAttemptDate: result.lastAttemptDate ? new Date(result.lastAttemptDate) : null,
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
          status: Not(TestStatus.ARCHIVED)
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
      const allQuestionIds: string[] = [];
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

  /**
   * Retrieves the most recent attempt (any status) for a user and test.
   * Used to determine if a user can resume an in-progress attempt.
   * 
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<TestAttempt | null> - The most recent attempt or null if none exists
   */
  private async getLastAttemptForResume(test: Test, userId: string, authContext: AuthContext): Promise<TestAttempt | null> {
    const testId = test.testId;

    // Handle allowResubmission logic
    if (test.allowResubmission) {
      // For tests with allowResubmission, return any existing attempt (in progress or submitted)
      return await this.testAttemptRepository.findOne({
        where: {
          testId,
          userId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
        order: { attempt: 'DESC' },
      });
    } else {
      // Original logic for tests without allowResubmission - only in-progress attempts
      return await this.testAttemptRepository.findOne({
        where: {
          testId,
          userId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
          status: AttemptStatus.IN_PROGRESS,
        },
        order: { attempt: 'DESC' },
      });
    }
  }

  /**
   * Counts the total number of attempts (any status) for a user and test.
   * @param testId - The unique identifier of the test
   * @param userId - The unique identifier of the user
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<number> - The total number of attempts made by the user
   */
  private async getTotalAttempts(testId: string, userId: string, authContext: AuthContext): Promise<number> {
    return await this.testAttemptRepository.count({
      where: {
        testId,
        userId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });
  }

  /**
   * Creates a deep copy of a test including all sections, questions, and rules.
   * The cloned test will be in DRAFT status and will have a new unique alias.
   * 
   * @param testId - The unique identifier of the test to clone
   * @param authContext - Authentication context containing tenant and organization IDs
   * @returns Promise<string> - The ID of the cloned test
   */
  async cloneTest(testId: string, authContext: AuthContext): Promise<string> {
    // Start a transaction for the entire cloning process
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the original test with all its relations
      const originalTest = await queryRunner.manager.findOne(Test, {
        where: {
          testId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
        relations: ['sections', 'questions'],
      });

      if (!originalTest) {
        throw new NotFoundException('Test not found');
      }

      // Create a new test with copied properties
      const clonedTestData: Partial<Test> = {
        type: originalTest.type,
        title: `${originalTest.title} (Copy)`,
        description: originalTest.description,
        reviewers: originalTest.reviewers,
        status: TestStatus.PUBLISHED,
        showTime: originalTest.showTime,
        timeDuration: originalTest.timeDuration,
        showTimeFinished: originalTest.showTimeFinished,
        timeFinishedDuration: originalTest.timeFinishedDuration,
        totalMarks: originalTest.totalMarks,
        passingMarks: originalTest.passingMarks,
        image: originalTest.image,
        startDate: originalTest.startDate,
        endDate: originalTest.endDate,
        answerSheet: originalTest.answerSheet,
        showCorrectAnswer: originalTest.showCorrectAnswer,
        printAnswersheet: originalTest.printAnswersheet,
        questionsShuffle: originalTest.questionsShuffle,
        answersShuffle: originalTest.answersShuffle,
        gradingType: originalTest.gradingType,
        isObjective: originalTest.isObjective,
        showThankyouPage: originalTest.showThankyouPage,
        showAllQuestions: originalTest.showAllQuestions,
        paginationLimit: originalTest.paginationLimit,
        showQuestionsOverview: originalTest.showQuestionsOverview,
        allowResubmission: originalTest.allowResubmission,
        ordering: originalTest.ordering,
        attempts: originalTest.attempts,
        attemptsGrading: originalTest.attemptsGrading,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        createdBy: authContext.userId,
      };

      // Generate unique alias for the cloned test
      const baseAlias = originalTest.alias ? `${originalTest.alias}_copy` : `${originalTest.title}_copy`;
      clonedTestData.alias = await HelperUtil.generateUniqueAliasWithRepo(
        baseAlias,
        this.testRepository,
        authContext.tenantId,
        authContext.organisationId,
      );

      // Create the cloned test
      const clonedTest = queryRunner.manager.create(Test, clonedTestData);
      const savedClonedTest = await queryRunner.manager.save(clonedTest);

      // Clone sections
      const sectionIdMapping = new Map<string, string>(); // original section ID -> new section ID
      
      for (const originalSection of originalTest.sections) {
        const clonedSectionData = {
          title: originalSection.title,
          description: originalSection.description,
          testId: savedClonedTest.testId,
          ordering: originalSection.ordering,
          status: originalSection.status,
          minQuestions: originalSection.minQuestions,
          maxQuestions: originalSection.maxQuestions,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
          createdBy: authContext.userId,
        };

        const clonedSection = queryRunner.manager.create(TestSection, clonedSectionData);
        const savedClonedSection = await queryRunner.manager.save(clonedSection);
        
        // Store the mapping for later use
        sectionIdMapping.set(originalSection.sectionId, savedClonedSection.sectionId);
      }

      // Clone test questions
      for (const originalQuestion of originalTest.questions) {
        const sectionId = originalQuestion.sectionId ? sectionIdMapping.get(originalQuestion.sectionId) : undefined;
        if (sectionId === null) continue; // Skip questions with invalid section mapping
        
        const clonedQuestionData = {
          testId: savedClonedTest.testId,
          questionId: originalQuestion.questionId,
          ordering: originalQuestion.ordering,
          sectionId: sectionId,
          ruleId: originalQuestion.ruleId,
          isCompulsory: originalQuestion.isCompulsory,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        };

        const clonedQuestion = queryRunner.manager.create(TestQuestion, clonedQuestionData);
        await queryRunner.manager.save(clonedQuestion);
      }

      // Clone test rules (if any)
      const originalRules = await queryRunner.manager.find(TestRule, {
        where: {
          testId,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
        },
      });

      for (const originalRule of originalRules) {
        const sectionId = originalRule.sectionId ? sectionIdMapping.get(originalRule.sectionId) : undefined;
        if (sectionId === null) continue; // Skip rules with invalid section mapping
        
        const clonedRuleData = {
          name: originalRule.name,
          description: originalRule.description,
          ruleType: originalRule.ruleType,
          testId: savedClonedTest.testId,
          sectionId: sectionId,
          numberOfQuestions: originalRule.numberOfQuestions,
          poolSize: originalRule.poolSize,
          minMarks: originalRule.minMarks,
          maxMarks: originalRule.maxMarks,
          selectionStrategy: originalRule.selectionStrategy,
          criteria: originalRule.criteria,
          selectionMode: originalRule.selectionMode,
          isActive: originalRule.isActive,
          priority: originalRule.priority,
          tenantId: authContext.tenantId,
          organisationId: authContext.organisationId,
          createdBy: authContext.userId,
        };

        const clonedRule = queryRunner.manager.create(TestRule, clonedRuleData);
        await queryRunner.manager.save(clonedRule);
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Invalidate cache
      await this.invalidateTestCache(authContext.tenantId);

      return savedClonedTest.testId;

    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  /**
   * Removes a question from a test section
   * @param testId - The test ID
   * @param questionId - The question ID to remove
   * @param authContext - Authentication context
   * @throws BadRequestException if test has attempts or is published
   * @throws NotFoundException if test, section, or question not found
   */
  async removeQuestionFromTest(testId: string, questionId: string, authContext: AuthContext): Promise<void> {
    // Check if test exists and user has access
    const test = await this.findOne(testId, authContext);
   
    // Check if test has any attempts
    await this.validateNoAttempts(testId, authContext);
    
    // Find the test question
    const testQuestion = await this.testQuestionRepository.findOne({
      where: {
        testId,
        questionId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
    });

    if (!testQuestion) {
      throw new NotFoundException('Question not found in this test');
    }

    // Remove the question from the test
    await this.testQuestionRepository.remove(testQuestion);
    
    // Invalidate cache
    await this.invalidateTestCache(authContext.tenantId);
  }

  /**
   * Generates a question-answer report for a test with pagination
   * @param testId - The test ID
   * @param limit - Number of records per page
   * @param offset - Number of records to skip
   * @param authContext - Authentication context
   * @returns QuestionAnswerReportResponseDto with paginated results
   */
  async generateQuestionAnswerReport(
    testId: string,
    limit: number = 10,
    offset: number = 0,
    authContext: AuthContext,
    authorization: string,
    userIds?: string[]
  ) {
    // Check if test exists and user has access
    const test = await this.findOne(testId, authContext);

    // Get test questions with proper ordering (sections first, then questions)
    const questions = await this.dataSource.query(`
      SELECT 
        tq."testQuestionId",
        tq."questionId",
        tq."sectionId",
        COALESCE(ts."ordering", 0) as "sectionOrdering",
        tq."ordering" as "questionOrdering",
        q."text" as "questionText",
        q."type" as "questionType",
        q."marks" as "questionMarks"
      FROM "testQuestions" tq
      INNER JOIN questions q ON tq."questionId" = q."questionId"
      LEFT JOIN "testSections" ts ON tq."sectionId" = ts."sectionId"
      WHERE tq."testId" = $1
        AND tq."tenantId" = $2
        AND tq."organisationId" = $3
      ORDER BY COALESCE(ts."ordering", 0) ASC, tq."ordering" ASC
    `, [testId, authContext.tenantId, authContext.organisationId]);

    if (questions.length === 0) {
      throw new NotFoundException('No questions found for this test');
    }

    // Get question options for objective questions
    const questionIds = questions.map(q => q.questionId);
    const options = await this.dataSource.query(`
      SELECT 
        "questionOptionId",
        "questionId",
        "text",
        "ordering",
        "isCorrect",
        "marks"
      FROM "questionOptions"
      WHERE "questionId" = ANY($1)
        AND "tenantId" = $2
        AND "organisationId" = $3
      ORDER BY "questionId", "ordering" ASC
    `, [questionIds, authContext.tenantId, authContext.organisationId]);

    // Create options map
    const optionsMap = new Map();
    options.forEach(option => {
      if (!optionsMap.has(option.questionId)) {
        optionsMap.set(option.questionId, []);
      }
      optionsMap.get(option.questionId).push(option);
    });

    // Get total count of users who attempted the test (with userIds filter if provided)
    let totalCountQuery = `
      SELECT COUNT(DISTINCT ta."userId") as total
      FROM "testAttempts" ta
      WHERE ta."testId" = $1
        AND ta."tenantId" = $2
        AND ta."organisationId" = $3
    `;
    
    const totalCountParams: any[] = [testId, authContext.tenantId, authContext.organisationId];
    
    // Add userIds filter if provided
    if (userIds && userIds.length > 0) {
      totalCountQuery += ` AND ta."userId" = ANY($4)`;
      totalCountParams.push(userIds);
    }
    
    const totalCountResult = await this.dataSource.query(totalCountQuery, totalCountParams);

    const totalElements = parseInt(totalCountResult[0]?.total || '0');

    if (totalElements === 0) {
      const columns = [
        { key: 'firstName', header: 'First Name', marks: 0, type: 'string' },
        { key: 'lastName', header: 'Last Name', marks: 0, type: 'string' },
        { key: 'email', header: 'Email', marks: 0, type: 'string' },
        { key: 'userId', header: 'User ID', marks: 0, type: 'string' },
        { key: 'attemptNumber', header: 'Attempt Number', marks: 0, type: 'number' },
        { key: 'score', header: 'Total Score', marks: 0, type: 'number' },
        { key: 'timeSpent', header: 'Time Spent (minutes)', marks: 0, type: 'number' },
        { key: 'status', header: 'Status', marks: 0, type: 'string' },
        { key: 'startTime', header: 'Start Time', marks: 0, type: 'datetime' },
        { key: 'submitTime', header: 'Submit Time', marks: 0, type: 'datetime' },
        ...questions.map(q => ({
          key: q.questionId,
          header: `${q.questionText}`,
          marks: q.questionMarks,
          type: q.questionType
        }))
      ];

      return {
        testId,
        testTitle: test.title,
        metadata: {
          totalQuestions: questions.length,
          gradingMethod: test.attemptsGrading,
          allowResubmission: test.allowResubmission,
          totalUsers: 0
        },
        columns,
        data: [],
        pagination: {
          totalElements: 0,
          totalPages: 0,
          currentPage: Math.floor(offset / limit) + 1,
          size: limit
        }
      };
    }

    // Get paginated user attempts with consistent ordering by startTime
    let userAttemptsQuery = `
      SELECT DISTINCT ON (ta."userId")
        ta."userId",
        ta."attempt" as "attemptNumber",
        ta."status",
        ta."startedAt" as "startTime",
        ta."submittedAt" as "submitTime",
        COALESCE(ta."timeSpent", 0) as "timeSpent",
        ta."score" as "totalScore"
      FROM "testAttempts" ta
      WHERE ta."testId" = $1
        AND ta."tenantId" = $2
        AND ta."organisationId" = $3
    `;

    const queryParams: any[] = [testId, authContext.tenantId, authContext.organisationId];
    let paramIndex = 4;

    // Add userIds filter if provided
    if (userIds && userIds.length > 0) {
      // Handle both array format and comma-separated string format
      let filteredUserIds = userIds;
      
      // If it's a single string with commas, split it
      if (userIds.length === 1 && typeof userIds[0] === 'string' && userIds[0].includes(',')) {
        filteredUserIds = userIds[0].split(',').map(id => id.trim());
      }
      
      userAttemptsQuery += ` AND ta."userId" = ANY($${paramIndex})`;
      queryParams.push(filteredUserIds);
      paramIndex++;
    }

    userAttemptsQuery += ` ORDER BY ta."userId", ta."startedAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const userAttempts = await this.dataSource.query(userAttemptsQuery, queryParams);

    // Get all answers for the paginated users
    const fetchedUserIds = userAttempts.map(ua => ua.userId);
    const userAnswers = await this.dataSource.query(`
      SELECT
        ta."userId",
        tua."questionId",
        tua."answer" as "answerText",
        tua."score",
        q."marks" as "maxScore"
      FROM "testUserAnswers" tua
      INNER JOIN "testAttempts" ta ON tua."attemptId" = ta."attemptId"
      INNER JOIN questions q ON tua."questionId" = q."questionId"
      WHERE ta."testId" = $1
        AND ta."userId" = ANY($2)
        AND q."tenantId" = $3
        AND q."organisationId" = $4
      ORDER BY ta."userId", tua."questionId"
    `, [testId, fetchedUserIds, authContext.tenantId, authContext.organisationId]);

    // Fetch user details from external API
    const userDetails = await this.fetchUserData(
      fetchedUserIds, 
      authContext.tenantId, 
      authContext.organisationId, 
      authorization
    );

    // Create a map for quick user lookup
    const userDetailsMap = new Map();
    userDetails.forEach(user => {
      userDetailsMap.set(user.userId, user);
    });



    // Process answers to extract proper option text or text
    const userAnswersMap = new Map();
    userAnswers.forEach(answer => {
      if (!userAnswersMap.has(answer.userId)) {
        userAnswersMap.set(answer.userId, new Map());
      }
      
      const userAnswerMap = userAnswersMap.get(answer.userId);
      let processedAnswer = '';
      
      try {
        // Parse the JSON answer
        const answerData = JSON.parse(answer.answerText);
        
        if (answerData.text) {
          // Subjective question with text
          processedAnswer = answerData.text;
        } else if (answerData.selectedOptionIds && Array.isArray(answerData.selectedOptionIds)) {
          // Objective question with selected option IDs
          const options = optionsMap.get(answer.questionId);
          if (options && answerData.selectedOptionIds.length > 0) {
            const selectedOptions = answerData.selectedOptionIds.map((optionId: string) => {
              const option = options.find(opt => opt.questionOptionId === optionId);
              return option ? option.text : optionId;
            });
            processedAnswer = selectedOptions.join('; ');
          } else {
            processedAnswer = answerData.selectedOptionIds.join('; ');
          }
        } else {
          // Fallback to original text
          processedAnswer = answer.answerText;
        }
      } catch (error) {
        // If JSON parsing fails, use original text
        processedAnswer = answer.answerText;
      }
      
      userAnswerMap.set(answer.questionId, processedAnswer);
    });

    // Create report rows using the paginated user attempts
    const reportRows: any[] = [];
    
    userAttempts.forEach(userAttempt => {
      const userAnswers = userAnswersMap.get(userAttempt.userId) || new Map();
      const answers = {};
      
      questions.forEach(q => {
        const answer = userAnswers.get(q.questionId);
        answers[q.questionId] = answer || '';
      });

      // Get user details from the fetched data
      const userDetail = userDetailsMap.get(userAttempt.userId) || {};

      reportRows.push({
        firstName: userDetail.firstName || '',
        lastName: userDetail.lastName || '',
        email: userDetail.email || '',
        userId: userAttempt.userId,
        answers,
        score: userAttempt.totalScore || 0,
        timeSpent: Math.round((userAttempt.timeSpent || 0) / 60), // Convert seconds to minutes
        attemptNumber: userAttempt.attemptNumber,
        status: userAttempt.status,
        startTime: userAttempt.startTime,
        submitTime: userAttempt.submitTime
      });
    });

    const totalPages = Math.ceil(totalElements / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    // Create column definitions
    const columns = [
      { key: 'firstName', header: 'First Name', marks: 0, type: 'string' },
      { key: 'lastName', header: 'Last Name', marks: 0, type: 'string' },
      { key: 'email', header: 'Email', marks: 0, type: 'string' },
      { key: 'userId', header: 'User ID', marks: 0, type: 'string' },
      { key: 'attemptNumber', header: 'Attempt Number', marks: 0, type: 'number' },
      { key: 'score', header: 'Total Score', marks: 0, type: 'number' },
      { key: 'timeSpent', header: 'Time Spent (minutes)', marks: 0, type: 'number' },
      { key: 'status', header: 'Status', marks: 0, type: 'string' },
      { key: 'startTime', header: 'Start Time', marks: 0, type: 'datetime' },
      { key: 'submitTime', header: 'Submit Time', marks: 0, type: 'datetime' },
      ...questions.map(q => ({
        key: q.questionId,
        header: `${q.questionText}`,
        marks: q.questionMarks,
        type: q.questionType
      }))
    ];

    // Transform report rows to flat format
    const flatData = reportRows.map(row => {
      const flatRow = {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        userId: row.userId,
        attemptNumber: row.attemptNumber,
        score: row.score,
        timeSpent: row.timeSpent,
        status: row.status,
        startTime: row.startTime,
        submitTime: row.submitTime
      };

      // Add question answers
      questions.forEach(q => {
        const answer = row.answers[q.questionId] || '';
        flatRow[q.questionId] = answer;
      });

      return flatRow;
    });

    return {
      testId,
      testTitle: test.title,
      metadata: {
        totalQuestions: questions.length,
        gradingMethod: test.attemptsGrading,
        allowResubmission: test.allowResubmission,
        totalUsers: totalElements
      },
      columns,
      data: flatData,
      pagination: {
        totalElements,
        totalPages,
        currentPage,
        size: limit
      }
    };
  }



  /**
   * Fetch user data from external API
   */
  private async fetchUserData(userIds: string[], tenantId: string, organisationId: string, authorization: string): Promise<any[]> {
    try {
      const userServiceUrl = this.configService.get('USER_SERVICE_URL', '');

      if (!userServiceUrl) {
        throw new BadRequestException(RESPONSE_MESSAGES.ERROR.USER_SERVICE_URL_NOT_CONFIGURED);
      }

      const response = await axios.post(`${userServiceUrl}/list`, {
        filters: { userId: userIds },
        limit: userIds.length,
        includeCustomFields: false,
        }, {
          headers: {
            'tenantid': tenantId,
            'organisationId': organisationId,
            'Authorization': authorization,
            'Content-Type': 'application/json'
          }
        });

      // Handle the actual response format from the user service
      const userDetails = response.data.result?.getUserDetails || [];
      
      // Filter out audit fields from user data
      return userDetails.map((user: any) => {
        const { createdBy, updatedBy, createdAt, updatedAt, ...userWithoutAudit } = user;
        return userWithoutAudit;
      });     
    } catch (error) {
      this.logger.error('Failed to fetch user data from external API', error);
      throw new BadRequestException(RESPONSE_MESSAGES.ERROR.FAILED_TO_FETCH_USER_DATA);
    }
  }

  /**
   * Check if a test contains only objective questions
   * @param testId - The test ID to check
   * @param authContext - Authentication context
   * @returns Promise<boolean> - true if all questions are objective, false otherwise
   */
  async checkIfTestIsObjective(testId: string, authContext: AuthContext): Promise<boolean> {
    try {
      // Get all questions for this test through test questions
      const testQuestions = await this.testQuestionRepository
        .createQueryBuilder('tq')
        .innerJoin('questions', 'q', 'q.questionId = tq.questionId')
        .select('q.type')
        .where('tq.testId = :testId', { testId })
        .andWhere('tq.tenantId = :tenantId', { tenantId: authContext.tenantId })
        .andWhere('tq.organisationId = :organisationId', { organisationId: authContext.organisationId })
        .getRawMany();

      if (testQuestions.length === 0) {
        // If no questions found, consider it objective (edge case)
        return true;
      }

      // Check if all questions are objective types
      const objectiveTypes = [
        QuestionType.MCQ,
        QuestionType.TRUE_FALSE,
        QuestionType.MULTIPLE_ANSWER,
        QuestionType.FILL_BLANK,
        QuestionType.MATCH
      ];

      return testQuestions.every(tq => objectiveTypes.includes(tq.type));
    } catch (error) {
      this.logger.error(`Error checking if test is objective: ${error.message}`, error.stack);
      // Return false as safe default (requires manual review)
      return false;
    }
  }

} 