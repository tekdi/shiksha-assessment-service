import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssociateQuestionOptionDto {
  @ApiProperty({
    description: 'ID of the question to associate with an option',
    example: 'q-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @ApiProperty({
    description: 'ID of the option to associate with the question',
    example: 'opt-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  optionId: string;
}
