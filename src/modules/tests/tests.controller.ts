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
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestDto } from './dto/query-test.dto';
import { AddQuestionToTestDto } from './dto/add-question-to-test.dto';
import { AddQuestionsBulkDto } from './dto/add-questions-bulk.dto';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';
import { TestStructureDto } from './dto/test-structure.dto';
import { QuestionAnswerReportDto } from './dto/question-answer-report.dto';
import { QuestionAnswerReportResponseDto } from './dto/question-answer-report-response.dto';


@ApiTags('Tests')
@ApiBearerAuth()
@Controller('tests')
@UseInterceptors(AuthContextInterceptor)
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new test',
    description: 'Creates a new test. Requires tenantId and organisationId headers.'
  })
  @ApiResponse({
    status: 201,
    description: 'Test created successfully',
    type: ApiSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required headers (tenantId, organisationId)',
  })
  async create(@Body() createTestDto: CreateTestDto, @Req() req: any) {
    const authContext: AuthContext = req.user;
    const test = await this.testsService.create(createTestDto, authContext);
    return { testId: test.testId };
  }

  @Get()
  @ApiOperation({ summary: 'Get all tests with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Tests retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async findAll(@Query() queryDto: QueryTestDto, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.testsService.findAll(queryDto, authContext);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a test by ID' })
  @ApiResponse({
    status: 200,
    description: 'Test retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.testsService.findOne(id, authContext);
  }

  @Get(':id/hierarchy')
  @ApiOperation({ summary: 'Get test hierarchy with sections and questions for leaner - with out correct options' })
  @ApiResponse({
    status: 200,
    description: 'Test hierarchy retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async getTestHierarchy(@Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    // showCorrectOptions is false by default as we don't want to show correct options to the user
    let showCorrectOptions = false;
    return this.testsService.getTestHierarchy(id, showCorrectOptions, authContext);
  }

  @Get(':id/test-hierarchy')
  @ApiOperation({ summary: 'Get test hierarchy with sections and questions-options for admin - with correct options' })
  @ApiResponse({
    status: 200,
    description: 'Test hierarchy retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async getHierarchy(@Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    // showCorrectOptions is true as we want to show correct options to the user
    let showCorrectOptions = true;
    return this.testsService.getTestHierarchyAdmin(id, showCorrectOptions, authContext);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a test' })
  @ApiResponse({
    status: 200,
    description: 'Test updated successfully',
    type: ApiSuccessResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateTestDto: UpdateTestDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const test = await this.testsService.update(id, updateTestDto, authContext);
    return { testId: test.testId };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a test' })
  @ApiResponse({
    status: 200,
    description: 'Test deleted successfully',
    type: ApiSuccessResponseDto,
  })
  async remove(@Param('id') id: string,
  @Query('hard') hardDelete: string, // expects 'true' as a string
  @Req() req: any) {
    const authContext: AuthContext = req.user;
    const isHardDelete = hardDelete === 'true';
    await this.testsService.remove(id, authContext, isHardDelete);
    return { message: 'Test deleted successfully' };
  }

  @Post(':id/questions')
  @ApiOperation({ 
    summary: 'Add a question to a test section',
    description: 'Adds a specific question to a test section. The question must exist and the section must belong to the specified test.'
  })
  @ApiBody({
    type: AddQuestionToTestDto,
    description: 'Question and section details'
  })
  @ApiResponse({
    status: 201,
    description: 'Question added to test successfully',
    type: ApiSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Question is already added to this test or test is published',
  })
  @ApiResponse({
    status: 404,
    description: 'Test, section, or question not found',
  })
  async addQuestionToTest(
    @Param('id') testId: string,
    @Body() addQuestionDto: AddQuestionToTestDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    await this.testsService.addQuestionToTest(
      testId, 
      addQuestionDto.sectionId, 
      addQuestionDto.questionId, 
      addQuestionDto.isCompulsory || false,
      authContext
    );
    return { message: 'Question added to test successfully' };
  }

  @Post(':id/questions/bulk')
  @ApiOperation({ 
    summary: 'Add multiple questions to a test section in bulk',
    description: 'Adds multiple questions to a test section in a single request. Duplicate questions are automatically skipped. Questions can be ordered and marked as compulsory.'
  })
  @ApiBody({
    type: AddQuestionsBulkDto,
    description: 'Section and questions details for bulk addition'
  })
  @ApiResponse({
    status: 201,
    description: 'Questions added to test successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Questions added to test successfully' },
        result: {
          type: 'object',
          properties: {
            added: { type: 'number', example: 5, description: 'Number of questions successfully added' },
            skipped: { type: 'number', example: 2, description: 'Number of questions skipped (duplicates or not found)' },
            errors: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['Questions not found: qstn-123, qstn-456'],
              description: 'List of error messages'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Test is published or invalid request data',
  })
  @ApiResponse({
    status: 404,
    description: 'Test or section not found',
  })
  async addQuestionsBulkToTest(
    @Param('id') testId: string,
    @Body() addQuestionsBulkDto: AddQuestionsBulkDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const result = await this.testsService.addQuestionsBulkToTest(
      testId, 
      addQuestionsBulkDto.sectionId, 
      addQuestionsBulkDto.questions, 
      authContext
    );
    return { 
      message: 'Questions added to test successfully',
      result
    };
  }

  @Delete(':testId/question/:questionId')
  @ApiOperation({ 
    summary: 'Remove a question from a test',
    description: 'Removes a specific question from a test. This operation is only allowed for tests that have no attempts and are not published.'
  })
  @ApiParam({
    name: 'testId',
    description: 'Unique identifier of the test',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiParam({
    name: 'questionId',
    description: 'Unique identifier of the question to remove',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @ApiResponse({
    status: 200,
    description: 'Question removed from test successfully',
    type: ApiSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Test has attempts, is published, or invalid request data',
  })
  @ApiResponse({
    status: 404,
    description: 'Test or question not found',
  })
  async removeQuestionFromTest(
    @Param('testId') testId: string,
    @Param('questionId') questionId: string,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    await this.testsService.removeQuestionFromTest(testId, questionId, authContext);
    return { message: 'Question removed from test successfully' };
  }

  @Get(':testId/users/:userId/status')
  @ApiOperation({ 
    summary: 'Check user test status',
    description: 'Determine if the user can resume, reattempt, or is restricted based on previous attempts. Returns max attempts allowed and total attempts made by the user.'
  })
  @ApiResponse({
    status: 200,
    description: 'User test status retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Test not found',
  })
  async getUserTestStatus(
    @Param('testId') testId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const status = await this.testsService.getUserTestStatus(testId, userId, authContext);
    return status;
  }

  @Put(':testId/structure')
  @ApiOperation({ 
    summary: 'Update test structure',
    description: 'Update the entire test structure including section ordering and question placement within sections. All structure changes are allowed regardless of whether users have started taking the test.'
  })
  @ApiParam({
    name: 'testId',
    description: 'Unique identifier of the test',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    type: TestStructureDto,
    description: 'Complete test structure with sections and questions'
  })
  @ApiResponse({
    status: 200,
    description: 'Test structure updated successfully',
    type: ApiSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid structure data, missing sections/questions, or test tracking has started',
  })
  @ApiResponse({
    status: 404,
    description: 'Test not found',
  })
  async updateTestStructure(
    @Param('testId', ParseUUIDPipe) testId: string,
    @Body() testStructureDto: TestStructureDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    await this.testsService.updateTestStructure(testId, testStructureDto, authContext);
    return { message: 'Test structure updated successfully' };
  }

  @Get(':testId/question-answer-report')
  @ApiOperation({ 
    summary: 'Generate question-answer report for a test',
    description: 'Generates a comprehensive report showing all user answers to test questions with proper section and question ordering. Includes pagination for efficient data retrieval.'
  })
  @ApiParam({
    name: 'testId',
    description: 'Unique identifier of the test',
    example: '1e97ff5b-a2d0-4e44-802f-521f3f097f00'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of records per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiQuery({
    name: 'userIds',
    description: 'Array of user IDs to filter the report. If empty or not provided, returns data for all users.',
    required: false,
    type: String,
    isArray: true,
    example: ['100ba777-ca99-4cea-8ec7-c1ddd763d97b', '1873de9c-4ea1d-4e2b-9b8a-edd570480dd5']
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of records to skip',
    required: false,
    type: Number,
    example: 0
  })
  @ApiResponse({
    status: 200,
    description: 'Question-answer report generated successfully',
    type: QuestionAnswerReportResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Test not found or no questions available',
  })
  async generateQuestionAnswerReport(
    @Param('testId', ParseUUIDPipe) testId: string,
    @Query() queryDto: QuestionAnswerReportDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const { limit = 10, offset = 0, userIds } = queryDto;
    const authorization = req.headers.authorization;
    return this.testsService.generateQuestionAnswerReport(testId, limit, offset, authContext, authorization, userIds);
  }

  @Post(':testId/clone')
  @ApiOperation({ 
    summary: 'Clone a test',
    description: 'Creates a deep copy of the test including all sections, questions, and rules. The cloned test will be in DRAFT status.'
  })
  @ApiParam({
    name: 'testId',
    description: 'Unique identifier of the test to clone',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 201,
    description: 'Test cloned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Test cloned successfully' },
        clonedTestId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Test not found',
  })
  async cloneTest(
    @Param('testId', ParseUUIDPipe) testId: string,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const clonedTestId = await this.testsService.cloneTest(testId, authContext);
    return { 
      message: 'Test cloned successfully',
      clonedTestId 
    };
  }
} 