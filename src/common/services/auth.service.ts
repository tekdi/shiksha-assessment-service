import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate a simple service token for service-to-service authentication
   */
  generateServiceToken(): string {
    const serviceToken = this.configService.get<string>('SERVICE_AUTH_TOKEN');
    if (serviceToken) {
      return `Bearer ${serviceToken}`;
    }

    // Fallback to API key if available
    const apiKey = this.configService.get<string>('LMS_SERVICE_API_KEY');
    if (apiKey) {
      return `ApiKey ${apiKey}`;
    }

    // Final fallback - use a default token for development
    this.logger.warn('No authentication token configured, using default token');
    return 'Bearer default-service-token';
  }

  /**
   * Get authorization header for service-to-service communication
   */
  getAuthorizationHeader(): string {
    return this.generateServiceToken();
  }

  /**
   * Validate if the service has proper authentication configured
   */
  isAuthenticationConfigured(): boolean {
    const serviceToken = this.configService.get<string>('SERVICE_AUTH_TOKEN');
    const apiKey = this.configService.get<string>('LMS_SERVICE_API_KEY');
    
    return !!(serviceToken || apiKey);
  }
} 