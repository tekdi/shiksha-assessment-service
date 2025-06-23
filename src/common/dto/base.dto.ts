import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class BaseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ver: string;

  @ApiProperty()
  ts: string;

  @ApiProperty()
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
    err: string | null;
    errmsg: string | null;
  };

  @ApiProperty()
  responseCode: string;

  @ApiProperty()
  result: any;
}

export class PaginationDto {
  @IsOptional()
  @ApiProperty({ required: false })
  limit?: number = 10;

  @IsOptional()
  @ApiProperty({ required: false })
  offset?: number = 0;

  @IsOptional()
  @ApiProperty({ required: false })
  search?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  sortBy?: string;
 
  @IsOptional()
  @ApiProperty({ required: false })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  content: T[];

  @ApiProperty()
  totalElements: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  size: number;
} 