import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestRule } from './entities/test-rule.entity';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(TestRule)
    private readonly ruleRepository: Repository<TestRule>,
  ) {}

  async create(createRuleDto: CreateRuleDto, authContext: AuthContext): Promise<TestRule> {
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
        id,
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
      order: { priority: 'DESC' },
    });
  }
} 