import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthContext } from '../interfaces/auth.interface';

@Injectable()
export class AuthContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extract tenant and organisation IDs from headers (support both formats)
    const tenantId = request.headers['tenantid'] || request.headers['tenant-id'] || request.headers['tenantId'];
    const organisationId = request.headers['organisationid'] || request.headers['organisation-id'] || request.headers['organisationId'];
    
    // Extract userId from headers first, then query params, with 'system' as default
    const userId = request.headers['userid'] || 
                   request.headers['user-id'] || 
                   request.headers['userId'] || 
                   request.query.userId || 
                   request.query.userid || 
                   'system';
                   
    
    // Validate required headers
    if (!tenantId) {
      throw new BadRequestException('tenantId header is required');
    }
    
    if (!organisationId) {
      throw new BadRequestException('organisationId header is required');
    }
    
    // tenantId, organisationId and userId are opaque string identifiers (not necessarily UUIDs),
    // so no format check is applied
    
    const token = (request.headers['authorization'] as string) ?? undefined;

    // Create auth context
    const authContext: AuthContext = {
      userId,
      tenantId,
      organisationId,
      token,
    };
    
    // Attach to request
    request.user = authContext;
    
    return next.handle();
  }
} 