import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSection } from './entities/test-section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { TestStatus, TestType } from './entities/test.entity';
import { Test } from './entities/test.entity';
import { TestRule } from './entities/test-rule.entity';
import { OrderingService } from '@/common/services/ordering.service';
import { TestAttempt } from './entities/test-attempt.entity';
import { TestQuestion } from './entities/test-question.entity';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(TestSection)
    private readonly sectionRepository: Repository<TestSection>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(TestRule)
    private readonly ruleRepository: Repository<TestRule>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepository: Repository<TestAttempt>,
    @InjectRepository(TestQuestion)
    private readonly testQuestionRepository: Repository<TestQuestion>,
    private readonly orderingService: OrderingService,
  ) {}

  async create(createSectionDto: CreateSectionDto, authContext: AuthContext): Promise<TestSection> {
    // Validate test type and section configuration
    await this.validateSectionConfiguration(createSectionDto.testId, authContext);

    // Set ordering if not provided
    let ordering = createSectionDto.ordering;
    if (ordering === undefined) {
      ordering = await this.orderingService.getNextSectionOrder(createSectionDto.testId, authContext);
    }

    const section = this.sectionRepository.create({
      ...createSectionDto,
      ordering,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
      createdBy: authContext.userId,
    });
    return this.sectionRepository.save(section);
  }

  async findAll(authContext: AuthContext): Promise<TestSection[]> {
    return this.sectionRepository.find({
      where: {
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { ordering: 'ASC' },
      relations: ['questions'],
    });
  }

  async findByTestId(testId: string, authContext: AuthContext): Promise<TestSection[]> {
    return this.sectionRepository.find({
      where: {
        testId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      order: { ordering: 'ASC' },
      relations: ['questions'],
    });
  }

  async findOne(id: string, authContext: AuthContext): Promise<TestSection> {
    const section = await this.sectionRepository.findOne({
      where: {
        sectionId: id,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
      },
      relations: ['questions'],
    });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return section;
  }

  async update(id: string, updateSectionDto: UpdateSectionDto, authContext: AuthContext): Promise<TestSection> {
    const section = await this.findOne(id, authContext);
    Object.assign(section, updateSectionDto);
    return this.sectionRepository.save(section);
  }

  async remove(id: string, authContext: AuthContext, isHardDelete: boolean = false): Promise<void> {
    const section = await this.findOne(id, authContext);
    
    // Check if section's test has any attempts
    await this.validateNoAttempts(section.testId, authContext);
    
    //Remove all test questions
    await this.testQuestionRepository.delete({
      sectionId: id,
      tenantId: authContext.tenantId,
      organisationId: authContext.organisationId,
    });

    if (isHardDelete) {
      // Then remove the section
      await this.sectionRepository.remove(section);
    } else {
      // Soft delete: Archive the section
      await this.sectionRepository.update(id, { status: TestStatus.ARCHIVED });
    }
  }

  /**
   * Validates that a test has no attempts before allowing section deletion
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
      throw new BadRequestException('Cannot delete section from test that has attempts. Archive the section instead.');
    }
  }

  private async validateSectionConfiguration(testId: string, authContext: AuthContext): Promise<void> {
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
      throw new BadRequestException('Cannot modify sections of a published test');
    }

    // Validate based on test type
    switch (test.type) {
      case TestType.PLAIN:
        // Plain tests can have sections with questions (no rules needed)
        // No additional validation needed for section creation
        break;

      case TestType.RULE_BASED:
        // Rule-based tests can have sections with rules and questions
        // No additional validation needed for section creation
        break;

      case TestType.GENERATED:
        // Generated tests are created automatically during attempts
        // Should not allow manual section creation
        throw new BadRequestException('Cannot manually create sections for generated tests. They are created automatically during test attempts.');

      default:
        throw new BadRequestException(`Unsupported test type: ${test.type}`);
    }
  }


} 