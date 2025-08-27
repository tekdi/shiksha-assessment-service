import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/base.dto';

export class ColumnDefinitionDto {
  @ApiProperty({
    description: 'Unique key for the column',
    example: 'userId'
  })
  key: string;

  @ApiProperty({
    description: 'Display header for the column',
    example: 'User ID'
  })
  header: string;

  @ApiProperty({
    description: 'Marks for the question (0 for non-question columns)',
    example: 1
  })
  marks: number;

  @ApiProperty({
    description: 'Type of the column (question type for questions, metadata type for others)',
    example: 'mcq',
    enum: ['mcq', 'essay', 'text', 'string', 'number', 'datetime', 'boolean']
  })
  type: string;
}

export class QuestionAnswerReportRowDto {
  @ApiProperty({
    description: 'User ID',
    example: '1873de9c-4a1d-4e2b-9b8a-edd570480dd5'
  })
  userId: string;

  @ApiProperty({
    description: 'Attempt number',
    example: 1
  })
  attemptNumber: number;

  @ApiProperty({
    description: 'Total score for the test attempt',
    example: 5.0
  })
  score: number;

  @ApiProperty({
    description: 'Time spent in minutes',
    example: 2
  })
  timeSpent: number;

  @ApiProperty({
    description: 'Test attempt status',
    example: 'S'
  })
  status: string;

  @ApiProperty({
    description: 'When the attempt started',
    example: '2025-08-11T10:09:37.424Z'
  })
  startTime: Date;

  @ApiProperty({
    description: 'When the attempt was submitted',
    example: '2025-08-11T10:10:29.439Z'
  })
  submitTime?: Date;

  // Dynamic question answer fields (using questionId as key) will be added here
  [key: string]: any; // Allow dynamic question answer fields
}

export class TestMetadataDto {
  @ApiProperty({
    description: 'Total number of questions in the test',
    example: 18
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Grading method used',
    example: 'last_attempt'
  })
  gradingMethod: string;

  @ApiProperty({
    description: 'Whether resubmission is allowed',
    example: true
  })
  allowResubmission: boolean;

  @ApiProperty({
    description: 'Total number of users who attempted the test',
    example: 8
  })
  totalUsers: number;
}

export class PaginationInfoDto {
  @ApiProperty({
    description: 'Total number of elements',
    example: 8
  })
  totalElements: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 1
  })
  totalPages: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  currentPage: number;

  @ApiProperty({
    description: 'Page size',
    example: 10
  })
  size: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: false
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false
  })
  hasPrevious: boolean;
}

export class QuestionAnswerReportResponseDto {
  @ApiProperty({
    description: 'Test ID',
    example: '1e97ff5b-a2d0-4e44-802f-521f3f097f00'
  })
  testId: string;

  @ApiProperty({
    description: 'Test title',
    example: 'ASSIGNMENT 5 - Complete the End of Module Assessment'
  })
  testTitle: string;

  @ApiProperty({
    description: 'Test metadata information',
    type: TestMetadataDto
  })
  metadata: TestMetadataDto;

  @ApiProperty({
    description: 'Column definitions for the report',
    type: [ColumnDefinitionDto]
  })
  columns: ColumnDefinitionDto[];

  @ApiProperty({
    description: 'Report data rows',
    type: [QuestionAnswerReportRowDto]
  })
  data: QuestionAnswerReportRowDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationInfoDto
  })
  pagination: PaginationInfoDto;
} 