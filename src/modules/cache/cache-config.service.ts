import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  // Cache key prefixes
  readonly CONFIG_PREFIX = 'tenant_config:';
  readonly TEST_HIERARCHY_PREFIX = 'test_hierarchy:';

  // Default TTL values (in seconds)
  TEST_HIERARCHY_TTL = 300; // 5 minutes

  // Assessment cache enabled flag
  readonly assessmentCacheEnabled: boolean;

  constructor(private configService: ConfigService) {
    // Override TTLs from config if available
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