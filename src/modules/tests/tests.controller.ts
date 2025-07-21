import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
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
import { TestStructureDto } from './dto/test-structure.dto';
import { Test } from './entities/test.entity';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';
import { API_IDS } from '@/common/constants/api-ids.constant';

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
  @ApiOperation({ summary: 'Get test hierarchy with sections and questions' })
  @ApiResponse({
    status: 200,
    description: 'Test hierarchy retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async getTestHierarchy(@Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.testsService.getTestHierarchy(id, authContext);
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
} 