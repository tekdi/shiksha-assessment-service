import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  // Cache key prefixes
  readonly CONFIG_PREFIX = 'tenant_config:';
  readonly TEST_HIERARCHY_PREFIX = 'test_hierarchy:';

  // TTL values (in seconds) - read from environment
  readonly TEST_HIERARCHY_TTL: number;

  // Assessment cache enabled flag
  readonly assessmentCacheEnabled: boolean;

  constructor(private configService: ConfigService) {
    // Read TTL from environment, default to 300 seconds (5 minutes) if not set
    this.TEST_HIERARCHY_TTL = parseInt(
      this.configService.get('CACHE_TEST_HIERARCHY_TTL') || '300',
      10,
    );
    
    // Check if assessment cache is enabled
    this.assessmentCacheEnabled = this.configService.get('ASSESSMENT_CACHE') === 'true';
  }

  // Configuration-related methods
  getTenantConfigKey(tenantId: string): string {
    return `${this.CONFIG_PREFIX}${tenantId}`;
  }

  // Test hierarchy cache key
  getTestHierarchyKey(testId: string, tenantId: string, organisationId: string): string {
    return `${this.TEST_HIERARCHY_PREFIX}${testId}:${tenantId}:${organisationId}`;
  }
} 