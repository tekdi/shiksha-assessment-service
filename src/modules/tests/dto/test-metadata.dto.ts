import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsUUID } from 'class-validator';

/**
 * Metadata for pathway vs LMS test differentiation.
 * context (PATHWAY), subType (EVENT), Ids (event IDs).
 */
export class TestMetadataDto {
  @ApiPropertyOptional({ description: 'Context e.g. PATHWAY', example: 'PATHWAY' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'SubType e.g. EVENT', example: 'EVENT' })
  @IsOptional()
  @IsString()
  subType?: string;

  @ApiPropertyOptional({ description: 'Array of IDs e.g. event UUIDs', type: [String], example: ['9a9e0daa-50dd-4d0e-8d10-36e7bc808f88'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  Ids?: string[];
}
