import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateQuestionAssociationDto {
  @ApiProperty({
    description: 'ID of the question to associate',
    example: 'q-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({
    description: 'ID of the option to associate with (for question-to-option association)',
    example: 'opt-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  optionId?: string;

  @ApiPropertyOptional({
    description: 'ID of the parent question to associate with (for question-to-question association)',
    example: 'q-parent-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  parentQuestionId?: string;

  @ApiPropertyOptional({
    description: 'Ordering for the association',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  ordering?: number;
}