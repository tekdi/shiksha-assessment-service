import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, ValidateIf } from 'class-validator';

/**
 * Nested context object in metadata.
 * type: PATHWAY | EVENT | etc.
 * id: optional string or array of ids (supported for both PATHWAY and EVENT)
 */
export class TestContextDto {
  @ApiPropertyOptional({ description: 'Context type e.g. PATHWAY, EVENT', example: 'PATHWAY' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Context id - string or array of ids (same for PATHWAY and EVENT)',
    oneOf: [
      { type: 'string', example: 'EVT_501' },
      { type: 'array', items: { type: 'string' }, example: ['844a3433-0ec0-4bf1-9ac5-f5010f55a054'] },
    ],
  })
  @IsOptional()
  @ValidateIf((o) => o.id !== undefined && o.id !== null && typeof o.id === 'string')
  @IsString()
  @ValidateIf((o) => o.id !== undefined && o.id !== null && Array.isArray(o.id))
  @IsArray()
  @IsString({ each: true })
  id?: string | string[];
}
