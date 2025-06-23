import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponseDto<T = any> {
  @ApiProperty({ example: 'api.test.create' })
  id: string;

  @ApiProperty({ example: '1.0' })
  ver: string;

  @ApiProperty({ example: '2023-11-02T10:33:23.321Z' })
  ts: string;

  @ApiProperty({
    example: {
      resmsgid: '3fc21690-796b-11ee-aa52-8d96a90bc246',
      msgid: '8f37305d-3a21-4494-86ce-04af5b7f2eb3',
      status: 'successful',
      err: null,
      errmsg: null,
    },
  })
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
    err: string | null;
    errmsg: string | null;
  };

  @ApiProperty({ example: 'OK' })
  responseCode: string;

  @ApiProperty()
  result: T;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 'api.test.create' })
  id: string;

  @ApiProperty({ example: '1.0' })
  ver: string;

  @ApiProperty({ example: '2023-11-02T10:33:23.321Z' })
  ts: string;

  @ApiProperty({
    example: {
      resmsgid: '3fc21690-796b-11ee-aa52-8d96a90bc246',
      msgid: '8f37305d-3a21-4494-86ce-04af5b7f2eb3',
      status: 'failed',
      err: 'VALIDATION_ERROR',
      errmsg: 'Invalid input parameters',
    },
  })
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
    err: string;
    errmsg: string;
  };

  @ApiProperty({ example: 'CLIENT_ERROR' })
  responseCode: string;

  @ApiProperty({ example: null })
  result: null;
}

export class ApiResponseBuilder {
  static success<T>(
    id: string,
    result: T,
    msgid?: string,
    resmsgid?: string,
  ): ApiSuccessResponseDto<T> {
    return {
      id,
      ver: '1.0',
      ts: new Date().toISOString(),
      params: {
        resmsgid: resmsgid || this.generateId(),
        msgid: msgid || this.generateId(),
        status: 'successful',
        err: null,
        errmsg: null,
      },
      responseCode: 'OK',
      result,
    };
  }

  static error(
    id: string,
    error: string,
    errorMessage: string,
    responseCode: string = 'CLIENT_ERROR',
    msgid?: string,
    resmsgid?: string,
  ): ApiErrorResponseDto {
    return {
      id,
      ver: '1.0',
      ts: new Date().toISOString(),
      params: {
        resmsgid: resmsgid || this.generateId(),
        msgid: msgid || this.generateId(),
        status: 'failed',
        err: error,
        errmsg: errorMessage,
      },
      responseCode,
      result: null,
    };
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// Common error types
export enum ErrorTypes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
}

// Common response codes
export enum ResponseCodes {
  OK = 'OK',
  CREATED = 'CREATED',
  CLIENT_ERROR = 'CLIENT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
} 