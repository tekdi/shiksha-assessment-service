import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CheckResultImportedDto {
  @ApiProperty({ description: 'User ID to check result import status for' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Test ID to check result import status for' })
  @IsUUID()
  testId: string;
}

