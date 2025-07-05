import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class StartNewAttemptDto {
  @ApiProperty({
    description: 'Test ID to start attempt for',
    example: 'test_123',
  })
  @IsString()
  testId: string;

  @ApiProperty({
    description: 'Optional initial time spent (in seconds)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialTimeSpent?: number;

  @ApiProperty({
    description: 'Optional initial position in test',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  initialPosition?: number;
} 