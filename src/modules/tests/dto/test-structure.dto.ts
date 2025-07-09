import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsArray, ValidateNested, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionStructureDto {
  @ApiProperty({
    description: 'Unique identifier of the question',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  questionId: string;

  @ApiProperty({
    description: 'Order of the question within the section (1-based)',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  order: number;
}

export class SectionStructureDto {
  @ApiProperty({
    description: 'Unique identifier of the section',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  sectionId: string;

  @ApiProperty({
    description: 'Order of the section within the test (1-based)',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({
    description: 'Array of questions in this section',
    type: [QuestionStructureDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionStructureDto)
  questions?: QuestionStructureDto[];
}

export class TestStructureDto {
  @ApiProperty({
    description: 'Array of sections in the test with their questions',
    type: [SectionStructureDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionStructureDto)
  sections: SectionStructureDto[];
} 