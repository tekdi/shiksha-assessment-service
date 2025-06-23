import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSection } from './entities/test-section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';

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

  async findAll(testId: string, authContext: AuthContext): Promise<TestSection[]> {
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

  async remove(id: string, authContext: AuthContext): Promise<void> {
    const section = await this.findOne(id, authContext);
    await this.sectionRepository.remove(section);
  }
} 