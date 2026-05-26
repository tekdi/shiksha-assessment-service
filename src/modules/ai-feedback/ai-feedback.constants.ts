export const AI_FEEDBACK_QUEUE = 'ai-feedback';

export const AI_FEEDBACK_JOB_NAME = 'process-ai-feedback';

// Max concurrent DevRev API calls at any time
export const QUEUE_CONCURRENCY = 10;

// Rate limit: max calls per window
export const QUEUE_RATE_LIMIT_MAX = 20;
export const QUEUE_RATE_LIMIT_DURATION_MS = 1_000;

// Retry config
export const MAX_JOB_ATTEMPTS = 4; // 1 initial + 3 retries
export const BACKOFF_BASE_DELAY_MS = 5_000;

// DevRev 429 retry
export const RATE_LIMIT_RETRY_DELAY_MS = 30_000;

// Scheduled auto-retry for permanently failed jobs
export const AUTO_RETRY_CRON = '0 */15 * * * *'; // every 15 minutes
export const AUTO_RETRY_MAX_COUNT = 3;            // max scheduled retries before giving up
export const AUTO_RETRY_MIN_AGE_MINUTES = 15;     // only retry jobs failed at least 15 min ago
