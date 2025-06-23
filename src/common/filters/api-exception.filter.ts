import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseBuilder, ErrorTypes, ResponseCodes } from '../dto/api-response.dto';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorType = ErrorTypes.INTERNAL_ERROR;
    let errorMessage = 'Internal server error';
    let responseCode = ResponseCodes.SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      // Map HTTP status codes to our error types
      switch (status) {
        case HttpStatus.BAD_REQUEST:
          errorType = ErrorTypes.VALIDATION_ERROR;
          responseCode = ResponseCodes.CLIENT_ERROR;
          break;
        case HttpStatus.UNAUTHORIZED:
          errorType = ErrorTypes.UNAUTHORIZED;
          responseCode = ResponseCodes.UNAUTHORIZED;
          break;
        case HttpStatus.FORBIDDEN:
          errorType = ErrorTypes.FORBIDDEN;
          responseCode = ResponseCodes.FORBIDDEN;
          break;
        case HttpStatus.NOT_FOUND:
          errorType = ErrorTypes.NOT_FOUND;
          responseCode = ResponseCodes.NOT_FOUND;
          break;
        case HttpStatus.CONFLICT:
          errorType = ErrorTypes.CONFLICT;
          responseCode = ResponseCodes.CONFLICT;
          break;
        default:
          errorType = ErrorTypes.BAD_REQUEST;
          responseCode = ResponseCodes.CLIENT_ERROR;
      }

      // Extract error message from exception
      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else if (exceptionResponse.message) {
        errorMessage = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message.join(', ')
          : exceptionResponse.message;
      } else if (exceptionResponse.error) {
        errorMessage = exceptionResponse.error;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    // Generate API ID from request path
    const apiId = this.generateApiId(request.path, request.method);

    const errorResponse = ApiResponseBuilder.error(
      apiId,
      errorType,
      errorMessage,
      responseCode,
    );

    response.status(status).json(errorResponse);
  }

  private generateApiId(path: string, method: string): string {
    // Convert path to API ID format
    // e.g., /assessment/v1/tests -> api.test.list
    const pathParts = path
      .replace('/assessment/v1/', '')
      .split('/')
      .filter(part => part.length > 0);
    
    if (pathParts.length === 0) return 'api.unknown';
    
    const resource = pathParts[0];
    const action = this.getActionFromMethod(method);
    
    return `api.${resource}.${action}`;
  }

  private getActionFromMethod(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'get';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'unknown';
    }
  }
} 