import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';

const TOKEN_CACHE_KEY = 'devrev:api_token';
const TOKEN_EXPIRY_CACHE_KEY = 'devrev:api_token_expiry';

// Rotate when less than 24 hours remain before expiry
const ROTATION_THRESHOLD_SECONDS = 24 * 60 * 60;

// Token lifetime issued to DevRev (30 days).
// Cache TTL is capped at 24 days to stay within Node's 32-bit setTimeout limit (~24.8 days max).
// The hourly cron rotates the token before expiry regardless.
const TOKEN_LIFETIME_DAYS = 30;
const TOKEN_CACHE_TTL_MS = 24 * 24 * 60 * 60 * 1000; // 24 days in ms

@Injectable()
export class DevRevTokenService implements OnModuleInit {
  private readonly logger = new Logger(DevRevTokenService.name);
  private readonly baseUrl: string;
  private readonly bootstrapToken: string;
  private readonly clientId: string;
  private readonly grantType: string;
  private readonly requestedTokenType: string;
  private readonly devrevEnabled: boolean;

  // In-memory cache — survives restarts only via Redis
  private inMemoryToken: string | null = null;
  private inMemoryExpiresAt: number | null = null; // unix seconds

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
    await this.checkAndRotateIfNeeded();
  }

  // Runs every hour — checks expiry and rotates only when needed.
  // Self-heals from startup failures and avoids calendar-day cron pitfalls.
  @Cron(CronExpression.EVERY_HOUR)
  async checkAndRotateIfNeeded(): Promise<void> {
    if (!this.devrevEnabled || !this.clientId) {
      return;
    }

    // Load from Redis if not in memory (e.g. after a restart)
    if (!this.inMemoryToken) {
      const cachedToken = await this.cacheManager.get<string>(TOKEN_CACHE_KEY);
      const cachedExpiry = await this.cacheManager.get<number>(TOKEN_EXPIRY_CACHE_KEY);
      if (cachedToken && cachedExpiry) {
        this.inMemoryToken = cachedToken;
        this.inMemoryExpiresAt = cachedExpiry;
        this.logger.log('DevRev token loaded from Redis cache');
      }
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = this.inMemoryExpiresAt
      ? this.inMemoryExpiresAt - nowSeconds
      : 0;

    if (this.inMemoryToken && secondsUntilExpiry > ROTATION_THRESHOLD_SECONDS) {
      this.logger.debug(
        `DevRev token valid for ${Math.floor(secondsUntilExpiry / 3600)}h — no rotation needed`,
      );
      return;
    }

    const reason = this.inMemoryToken
      ? `token expires in ${Math.floor(secondsUntilExpiry / 3600)}h (threshold: 24h)`
      : 'no token in memory or cache';
    this.logger.log(`Rotating DevRev API token — reason: ${reason}`);
    await this.rotateToken();
  }

  private async rotateToken(): Promise<void> {
    try {
      const { token, expiresAt } = await this.issueToken();

      this.inMemoryToken = token;
      this.inMemoryExpiresAt = expiresAt;

      // TTL in milliseconds for cache-manager
      await this.cacheManager.set(TOKEN_CACHE_KEY, token, TOKEN_CACHE_TTL_MS);
      await this.cacheManager.set(TOKEN_EXPIRY_CACHE_KEY, expiresAt, TOKEN_CACHE_TTL_MS);

      this.logger.log(
        `DevRev API token rotated successfully. Expires at: ${new Date(expiresAt * 1000).toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `DevRev token rotation failed: ${error?.message}. Will retry on next hourly check.`,
      );
    }
  }

  private async issueToken(): Promise<{ token: string; expiresAt: number }> {
    const requestBody = {
      grant_type: this.grantType,
      requested_token_type: this.requestedTokenType,
      client_id: this.clientId,
      expires_in: TOKEN_LIFETIME_DAYS,
      token_hint: 'Renewed Service Account Token',
    };

    this.logger.log(
      `Issuing new DevRev token. URL: ${this.baseUrl}/auth-tokens.create, body: ${JSON.stringify(requestBody)}`,
    );

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

    // Calculate expiry from response exp claim or fall back to TOKEN_LIFETIME_DAYS
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresAt =
      response.data?.expires_in
        ? nowSeconds + response.data.expires_in
        : nowSeconds + TOKEN_LIFETIME_DAYS * 24 * 60 * 60;

    return { token, expiresAt };
  }

  getToken(): string {
    return this.inMemoryToken ?? this.bootstrapToken;
  }
}
