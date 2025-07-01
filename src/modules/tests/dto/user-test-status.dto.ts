import { ApiProperty } from '@nestjs/swagger';
import { AttemptStatus } from '../entities/test-attempt.entity';

export class UserTestStatusDto {
  @ApiProperty({
    description: 'Whether the user can resume an existing attempt',
    example: true,
  })
  canResume: boolean;

  @ApiProperty({
    description: 'Whether the user can start a new attempt',
    example: false,
  })
  canReattempt: boolean;

  @ApiProperty({
    description: 'Status of the last attempt',
    enum: AttemptStatus,
    example: 'I',
  })
  lastAttemptStatus: AttemptStatus | null;

  @ApiProperty({
    description: 'ID of the last attempt',
    example: 'attempt_abc123',
    required: false,
  })
  lastAttemptId: string | null;
} 