import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { CacheService } from '../cache/cache.service';

const TOKEN_CACHE_KEY = 'devrev:api_token';
// 29 days in seconds — rotate 1 day before the 30-day expiry
const TOKEN_TTL_SECONDS = 29 * 24 * 60 * 60;

@Injectable()
export class DevRevTokenService implements OnModuleInit {
  private readonly logger = new Logger(DevRevTokenService.name);
  private readonly baseUrl: string;
  private readonly bootstrapToken: string;
  private readonly clientId: string;
  private readonly grantType: string;
  private readonly requestedTokenType: string;
  private readonly devrevEnabled: boolean;

  // In-memory fallback when Redis (CACHE_ENABLED=false)
  private inMemoryToken: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'DEVREV_BASE_URL',
      'https://api.devrev.ai/internal',
    );
    this.bootstrapToken = this.configService.get<string>('DEVREV_API_TOKEN', '');
    this.clientId = this.configService.get<string>('DEVREV_TOKEN_CLIENT_ID', '');
    this.grantType = this.configService.get<string>(
      'DEVREV_TOKEN_GRANT_TYPE',
      'urn:devrev:params:oauth:grant-type:token-issue',
    );
    this.requestedTokenType = this.configService.get<string>(
      'DEVREV_TOKEN_REQUESTED_TYPE',
      'urn:devrev:params:oauth:token-type:aat',
    );
    this.devrevEnabled =
      this.configService.get<string>('DEVREV_ENABLED', 'true') === 'true';
  }

  async onModuleInit(): Promise<void> {
    if (!this.devrevEnabled || !this.clientId) {
      return;
    }

    const cached = await this.cacheService.get<string>(TOKEN_CACHE_KEY);
    if (cached) {
      this.inMemoryToken = cached;
      this.logger.log('DevRev token loaded from cache');
      return;
    }

    // No cached token — issue a fresh one on startup
    await this.rotateToken();
  }

  // Runs every 29 days at midnight
  @Cron('0 0 */29 * *')
  async rotateToken(): Promise<void> {
    if (!this.devrevEnabled || !this.clientId) {
      return;
    }

    this.logger.log('Rotating DevRev API token…');

    try {
      const newToken = await this.issueToken();
      this.inMemoryToken = newToken;
      await this.cacheService.set(TOKEN_CACHE_KEY, newToken, TOKEN_TTL_SECONDS);
      this.logger.log('DevRev API token rotated and cached successfully');
    } catch (error) {
      this.logger.error(
        `DevRev token rotation failed: ${error?.message}. Continuing with existing token.`,
      );
    }
  }

  private async issueToken(): Promise<string> {
    const requestBody = {
      grant_type: this.grantType,
      requested_token_type: this.requestedTokenType,
      client_id: this.clientId,
      expires_in: 30,
      token_hint: 'Renewed Service Account Token',
    };

    const response = await axios.post(
      `${this.baseUrl}/auth-tokens.create`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.bootstrapToken}`,
        },
        timeout: 15_000,
      },
    );

    this.logger.log(
      `DevRev auth-tokens.create response [${response.status}]: ${JSON.stringify(response.data)}`,
    );

    const token =
      response.data?.access_token ??
      response.data?.token?.token_jti ??
      response.data?.token;

    if (!token || typeof token !== 'string') {
      throw new Error(
        `Unexpected token response shape: ${JSON.stringify(response.data)}`,
      );
    }

    return token;
  }

  getToken(): string {    
    return this.inMemoryToken ?? this.bootstrapToken;
  }
}
