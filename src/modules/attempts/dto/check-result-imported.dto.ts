import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CheckResultImportedDto {
  @ApiProperty({ description: 'User ID to check result import status for' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Test ID to check result import status for' })
  @IsUUID()
  testId: string;
}

