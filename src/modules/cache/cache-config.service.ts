import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  // Cache key prefixes
  readonly CONFIG_PREFIX = 'tenant_config:';

  constructor(private configService: ConfigService) {
    // Configuration can be extended here if needed
  }

  // Configuration-related methods
  getTenantConfigKey(tenantId: string): string {
    return `${this.CONFIG_PREFIX}${tenantId}`;
  }
} 