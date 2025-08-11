import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheConfigService } from './cache-config.service';
import { ConfigService } from '@nestjs/config';
import { TenantConfigValue } from '../configuration/interfaces/tenant-config.interface';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cacheEnabled: boolean;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly cacheConfig: CacheConfigService
  ) {
    this.cacheEnabled = this.configService.get('CACHE_ENABLED') === 'true';
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.cacheEnabled) {
      this.logger.debug(`Cache is ${!this.cacheEnabled ? 'disabled' : 'not connected'}, skipping get for key ${key}`);
      return null;
    }

    try {
      this.logger.debug(`Attempting to get cache for key ${key}`);
      const value = await this.cacheManager.get<T>(key);
      if (value !== undefined && value !== null) {
        this.logger.debug(`Cache HIT for key ${key}`);
        return value;
      } else {
        this.logger.debug(`Cache MISS for key ${key}`);
        return null;
      }
      return value || null;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds
   */
  async set(key: string, value: any, ttl: number): Promise<void> {
    if (!this.cacheEnabled) {
      this.logger.debug(`Cache is ${!this.cacheEnabled ? 'disabled' : 'not connected'}, skipping set for key ${key}`);
      return;
    }

    try {
      this.logger.debug(`Attempting to set cache for key ${key} with TTL ${ttl}s`);
      await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
      this.logger.debug(`Successfully set cache for key ${key}`);
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}: ${error.message}`, error.stack);
    }
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }

    try {
      // this.logger.debug(`Deleting cache for key ${key}`);
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete multiple values from cache using pattern
   * @param pattern Cache key pattern (supports :* wildcard at the end)
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }

    try {
      // Get all keys from the cache store
      const store = (this.cacheManager as any).store;
      if (!store || typeof store.keys !== 'function') {
        return;
      }

      const keys = await store.keys();

      // Convert pattern to regex if it ends with :*
      const patternRegex = pattern.endsWith(':*') 
        ? new RegExp(`^${pattern.slice(0, -2)}:.*$`)
        : new RegExp(`^${pattern}$`);

      const matchingKeys = keys.filter(key => patternRegex.test(key));
      
      if (matchingKeys.length > 0) {
        this.logger.debug(`Found ${matchingKeys.length} keys matching pattern ${pattern}`);
        await Promise.all(matchingKeys.map(key => this.del(key)));
      } else {
      }
    } catch (error) {
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }

    try {
      const store = (this.cacheManager as any).store;
      if (!store || typeof store.reset !== 'function') {
        this.logger.warn('Cache store does not support reset');
        return;
      }
      await store.reset();
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`);
    }
  }

  // Configuration-specific cache methods
  async getTenantConfig(tenantId: string): Promise<TenantConfigValue | null> {  
    const key = this.cacheConfig.getTenantConfigKey(tenantId);
    const value = await this.cacheManager.get<any>(key);
    if (value !== undefined && value !== null) {
      this.logger.debug(`Cache HIT for key ${key}`);
      return value;
    } else {
      this.logger.debug(`Cache MISS for key ${key}`);
      return null;
    }
  }

  async setTenantConfig(tenantId: string, config: TenantConfigValue): Promise<void> {
   
    const key = this.cacheConfig.getTenantConfigKey(tenantId);
    await this.cacheManager.set(key, config, 0);  
  
  }

  async deleteTenantConfig(tenantId: string): Promise<void> {
   
    const key = this.cacheConfig.getTenantConfigKey(tenantId);
    await this.cacheManager.del(key); 
  
  }
} 