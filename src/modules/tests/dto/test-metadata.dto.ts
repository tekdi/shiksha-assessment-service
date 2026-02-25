import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsUUID } from 'class-validator';

/**
 * Metadata for pathway vs LMS test differentiation.
 * Used in test create/update and list filter.
 */
export class TestMetadataDto {
  @ApiPropertyOptional({ description: 'Whether this test is linked to a pathway (vs LMS)' })
  @IsOptional()
  @IsBoolean()
  isPathway?: boolean;

  @ApiPropertyOptional({ description: 'Pathway event UUID when isPathway is true' })
  @IsOptional()
  @IsUUID()
  pathway_eventId?: string;
}
