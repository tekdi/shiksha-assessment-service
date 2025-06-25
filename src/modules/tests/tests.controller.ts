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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestDto } from './dto/query-test.dto';
import { Test } from './entities/test.entity';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';

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
  @ApiOperation({ summary: 'Add a question to a test section' })
  @ApiResponse({
    status: 201,
    description: 'Question added to test successfully',
    type: ApiSuccessResponseDto,
  })
  async addQuestionToTest(
    @Param('id') testId: string,
    @Body() body: { sectionId: string; questionId: string },
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    await this.testsService.addQuestionToTest(testId, body.sectionId, body.questionId, authContext);
    return { message: 'Question added to test successfully' };
  }
} 