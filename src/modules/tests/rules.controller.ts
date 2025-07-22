import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';
import { UseInterceptors } from '@nestjs/common';

@ApiTags('Test Rules')
@ApiBearerAuth()
@Controller('rules')
@UseInterceptors(AuthContextInterceptor)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new test rule' })
  @ApiResponse({ status: 201, description: 'Rule created', type: ApiSuccessResponseDto })
  async create(@Body() createRuleDto: CreateRuleDto, @Req() req: any) {
    const authContext: AuthContext = req.user;
    const rule = await this.rulesService.create(createRuleDto, authContext);
    return { ruleId: rule.ruleId };
  }

  @Get()
  @ApiOperation({ summary: 'List all rules with optional filters' })
  @ApiResponse({ status: 200, description: 'Rules listed', type: ApiSuccessResponseDto })
  async findAll(
    @Query('testId') testId?: string,
    @Query('sectionId') sectionId?: string,
    @Req() req?: any,
  ) {
    const authContext: AuthContext = req.user;
    return this.rulesService.findAll(authContext, testId, sectionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a rule by ID' })
  @ApiResponse({ status: 200, description: 'Rule found', type: ApiSuccessResponseDto })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.rulesService.findOne(id, authContext);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a rule' })
  @ApiResponse({ status: 200, description: 'Rule updated', type: ApiSuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateRuleDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const rule = await this.rulesService.update(id, updateRuleDto, authContext);
    return { ruleId: rule.ruleId };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a rule' })
  @ApiResponse({ status: 200, description: 'Rule deleted', type: ApiSuccessResponseDto })
  async remove(@Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    await this.rulesService.remove(id, authContext);
    return { message: 'Rule deleted successfully' };
  }

  @Get('test/:testId')
  @ApiOperation({ summary: 'Get all rules for a specific test' })
  @ApiResponse({ status: 200, description: 'Rules for test', type: ApiSuccessResponseDto })
  async getRulesForTest(@Param('testId') testId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.rulesService.getRulesForTest(testId, authContext);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get all rules for a specific section' })
  @ApiResponse({ status: 200, description: 'Rules for section', type: ApiSuccessResponseDto })
  async getRulesForSection(@Param('sectionId') sectionId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.rulesService.getRulesForSection(sectionId, authContext);
  }

  @Get(':ruleId/preview')
  @ApiOperation({ summary: 'Get rule preview with metadata' })
  @ApiParam({ name: 'ruleId', description: 'Rule ID' })
  @ApiResponse({ status: 200, description: 'Rule preview with metadata' })
  async getRulePreview(
    @Param('ruleId') ruleId: string,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    return this.rulesService.getRulePreview(ruleId, authContext);
  }

  @Post(':ruleId/questions')
  @ApiOperation({ summary: 'Get questions based on rule criteria for pre-selection' })
  @ApiParam({ name: 'ruleId', description: 'Rule ID' })
  @ApiResponse({ status: 200, description: 'Questions matching rule criteria' })
  async getQuestionsByCriteria(
    @Param('ruleId') ruleId: string,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    return this.rulesService.getQuestionsByCriteria(ruleId, authContext);
  }
} 