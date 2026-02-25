import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested, ValidateIf, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { TestContextDto } from './test-context.dto';

/**
 * Metadata for pathway vs LMS test differentiation.
 * context: single object { type, id? } OR array of contexts (e.g. both PATHWAY and EVENT).
 */
export class TestMetadataDto {
  @ApiPropertyOptional({
    description: 'Single context or array of contexts (e.g. PATHWAY + EVENT)',
    oneOf: [
      { $ref: '#/components/schemas/TestContextDto' },
      { type: 'array', items: { $ref: '#/components/schemas/TestContextDto' } },
    ],
    examples: [
      { type: 'PATHWAY' },
      [
        { type: 'PATHWAY', id: ['d770cae8-8bc4-4f0b-ac4b-b30ff55f4cff'] },
        { type: 'EVENT', id: ['844a3433-0ec0-4bf1-9ac5-f5010f55a054'] },
      ],
    ],
  })
  @IsOptional()
  @ValidateIf((o) => o.context !== undefined && o.context !== null && !Array.isArray(o.context))
  @ValidateNested()
  @Type(() => TestContextDto)
  @ValidateIf((o) => o.context !== undefined && o.context !== null && Array.isArray(o.context))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestContextDto)
  context?: TestContextDto | TestContextDto[];
}
