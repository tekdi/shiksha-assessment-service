import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponseBuilder } from '../dto/api-response.dto';

export interface Response<T> {
  data: T;
  statusCode: number;
  message: string;
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    return next.handle().pipe(
      map(data => {
        // If data is already in our API format, return as is
        if (data && typeof data === 'object' && 'id' in data && 'ver' in data) {
          return data;
        }

        // Generate API ID from request path
        const apiId = this.generateApiId(request.path, request.method);
        
        // Transform the response to our standard format
        return ApiResponseBuilder.success(apiId, data);
      }),
    );
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
        return 'list';
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