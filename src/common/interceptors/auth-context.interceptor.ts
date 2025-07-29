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
                   request.query.userid;
                   
    
    // Validate required headers
    if (!tenantId) {
      throw new BadRequestException('tenantId header is required');
    }
    
    if (!organisationId) {
      throw new BadRequestException('organisationId header is required');
    }
    
    // Validate UUID format (optional but recommended)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(tenantId)) {
      throw new BadRequestException('tenantId must be a valid UUID format');
    }
    
    if (!uuidRegex.test(organisationId)) {
      throw new BadRequestException('organisationId must be a valid UUID format');
    }
    
    if (!uuidRegex.test(userId)) {
      throw new BadRequestException('userId must be a valid UUID format');
    }
    
    // Create auth context
    const authContext: AuthContext = {
      userId,
      tenantId,
      organisationId,
    };
    
    // Attach to request
    request.user = authContext;
    
    return next.handle();
  }
} 