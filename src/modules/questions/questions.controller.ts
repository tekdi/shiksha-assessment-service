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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
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
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
    type: ApiSuccessResponseDto,
  })
  async create(@Body() createQuestionDto: CreateQuestionDto, @Req() req: any) {
    const authContext: AuthContext = req.user;
    const question = await this.questionsService.create(createQuestionDto, authContext);
    return { questionId: question.questionId };
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
    return { questionId: question.id };
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
} 