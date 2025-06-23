export interface Migration {
  version: string;
  name: string;
  description: string;
  up: (connection: any) => Promise<void>;
  down: (connection: any) => Promise<void>;
  dependencies?: string[];
}

export interface MigrationRecord {
  id: number;
  version: string;
  name: string;
  executedAt: Date;
  executionTime: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface MigrationConfig {
  tableName: string;
  lockTimeout: number;
  retryAttempts: number;
}

export interface MigrationResult {
  success: boolean;
  migrationsExecuted: string[];
  errors: string[];
  executionTime: number;
} 