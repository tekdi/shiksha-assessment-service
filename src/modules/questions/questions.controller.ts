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
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { RulePreviewDto } from './dto/rule-preview.dto';
import { CreateQuestionAssociationDto } from './dto/create-question-association.dto';
import { AssociateQuestionOptionDto } from './dto/associate-question-option.dto';
import { GetChildQuestionsQueryDto, ChildQuestionDto } from './dto/get-child-questions.dto';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';

@ApiTags('Questions')
@ApiBearerAuth()
@Controller('questions')
@UseInterceptors(AuthContextInterceptor)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new question',
    description: 'Create a new question. Optionally add it to a test section if testId and sectionId are provided.'
  })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
    type: ApiSuccessResponseDto,
  })
  async create(@Body() createQuestionDto: CreateQuestionDto, @Req() req: any) {
    const authContext: AuthContext = req.user;
    const question = await this.questionsService.create(createQuestionDto, authContext);
    return question;
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async findAll(@Query() queryDto: QueryQuestionDto, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.questionsService.findAll(queryDto, authContext);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiResponse({
    status: 200,
    description: 'Question retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.questionsService.findOne(id, authContext);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({
    status: 200,
    description: 'Question updated successfully',
    type: ApiSuccessResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const question = await this.questionsService.update(id, updateQuestionDto, authContext);
    return question;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({
    status: 200,
    description: 'Question deleted successfully',
    type: ApiSuccessResponseDto,
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    await this.questionsService.remove(id, authContext);
    return { message: 'Question deleted successfully' };
  }

  @Post('rule-preview')
  @ApiOperation({ 
    summary: 'Preview questions for rule criteria',
    description: 'Get questions and metadata based on rule criteria for UI preview'
  })
  @ApiBody({
    type: RulePreviewDto,
    description: 'Rule criteria for filtering questions'
  })
  @ApiResponse({
    status: 200,
    description: 'Rule preview generated successfully',
    type: ApiSuccessResponseDto,
  })
  async getRulePreview(@Body() ruleCriteria: RulePreviewDto, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.questionsService.getQuestionsForRulePreview(ruleCriteria, authContext);
  }

  @Post('associate-option')
  @ApiOperation({
    summary: 'Associate a question with an option',
    description: 'Creates a conditional question relationship by associating a question with an option'
  })
  @ApiBody({
    type: AssociateQuestionOptionDto,
    description: 'Question and option IDs for association'
  })
  @ApiResponse({
    status: 201,
    description: 'Question successfully associated with option',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or association already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Question or option not found',
  })
  async associateQuestionWithOption(@Body() associateDto: AssociateQuestionOptionDto, @Req() req: any) {
    const authContext: AuthContext = req.user;
    await this.questionsService.associateQuestionWithOption(
      associateDto.questionId,
      associateDto.optionId,
      authContext
    );
    
    return {
      success: true,
      message: 'Question successfully associated with option',
      data: null,
      timestamp: new Date().toISOString()
    };
  }

  @Post('disassociate-option')
  @ApiOperation({
    summary: 'Remove association between a question and an option',
    description: 'Removes the conditional question relationship between a question and an option'
  })
  @ApiBody({
    type: AssociateQuestionOptionDto,
    description: 'Question and option IDs for disassociation'
  })
  @ApiResponse({
    status: 200,
    description: 'Question successfully disassociated from option',
  })
  @ApiResponse({
    status: 404,
    description: 'Association not found',
  })
  async removeQuestionOptionAssociation(@Body() associateDto: AssociateQuestionOptionDto, @Req() req: any) {
    const authContext: AuthContext = req.user;
    await this.questionsService.removeQuestionOptionAssociation(
      associateDto.questionId,
      associateDto.optionId,
      authContext
    );
    
    return {
      success: true,
      message: 'Question successfully disassociated from option',
      data: null,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id/child-questions')
  @ApiOperation({
    summary: 'Get child questions of a parent question',
    description: 'Retrieves all conditional child questions associated with a parent question'
  })
  @ApiResponse({
    status: 200,
    description: 'Child questions retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent question not found',
  })
  async getChildQuestions(
    @Param('id') parentQuestionId: string,
    @Query() queryDto: GetChildQuestionsQueryDto,
    @Req() req: any
  ) {
    const authContext: AuthContext = req.user;
    const childQuestions = await this.questionsService.getChildQuestions(
      parentQuestionId,
      authContext,
      queryDto.includeOptions,
      queryDto.includeAssociatedOptions
    );
    
    return {
      success: true,
      message: 'Child questions retrieved successfully',
      data: childQuestions,
      timestamp: new Date().toISOString()
    };
  }
}