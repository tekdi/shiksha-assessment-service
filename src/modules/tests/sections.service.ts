import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSection } from './entities/test-section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { TestStatus } from './entities/test.entity';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(TestSection)
    private readonly sectionRepository: Repository<TestSection>,
  ) {}

  async create(createSectionDto: CreateSectionDto, authContext: AuthContext): Promise<TestSection> {
    const section = this.sectionRepository.create({
      ...createSectionDto,
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
    if (isHardDelete) {
      await this.sectionRepository.remove(section);
    } else {
      await this.sectionRepository.update(id, { status: TestStatus.ARCHIVED });
    }
  }
} 