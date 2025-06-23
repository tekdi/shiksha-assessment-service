import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Migration, MigrationRecord, MigrationConfig, MigrationResult } from '../interfaces/migration.interface';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly config: MigrationConfig = {
    tableName: 'migrations',
    lockTimeout: 30000, // 30 seconds
    retryAttempts: 3,
  };

  constructor(private readonly dataSource: DataSource) {}

  async initialize(): Promise<void> {
    await this.createMigrationsTable();
  }

  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.config.tableName} (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time INTEGER,
        status VARCHAR(20) NOT NULL DEFAULT 'success',
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await this.dataSource.query(query);
    this.logger.log('Migrations table initialized');
  }

  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const query = `SELECT * FROM ${this.config.tableName} ORDER BY version ASC`;
    const results = await this.dataSource.query(query);
    
    return results.map((row: any) => ({
      id: row.id,
      version: row.version,
      name: row.name,
      executedAt: new Date(row.executed_at),
      executionTime: row.execution_time,
      status: row.status,
      error: row.error,
    }));
  }

  async getPendingMigrations(migrations: Migration[]): Promise<Migration[]> {
    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));

    return migrations.filter(migration => !executedVersions.has(migration.version));
  }

  async runMigrations(migrations: Migration[]): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migrationsExecuted: [],
      errors: [],
      executionTime: 0,
    };

    try {
      await this.initialize();
      
      const pendingMigrations = await this.getPendingMigrations(migrations);
      
      if (pendingMigrations.length === 0) {
        this.logger.log('No pending migrations found');
        return result;
      }

      // Sort migrations by version and dependencies
      const sortedMigrations = this.sortMigrations(pendingMigrations);
      
      this.logger.log(`Found ${sortedMigrations.length} pending migrations`);

      for (const migration of sortedMigrations) {
        try {
          this.logger.log(`Running migration: ${migration.version} - ${migration.name}`);
          
          const migrationStartTime = Date.now();
          await migration.up(this.dataSource);
          const migrationEndTime = Date.now();
          
          // Record successful migration
          await this.recordMigration(migration, migrationEndTime - migrationStartTime, 'success');
          
          result.migrationsExecuted.push(migration.version);
          this.logger.log(`Migration ${migration.version} completed successfully`);
          
        } catch (error) {
          this.logger.error(`Migration ${migration.version} failed: ${error.message}`);
          
          // Record failed migration
          await this.recordMigration(migration, 0, 'failed', error.message);
          
          result.errors.push(`${migration.version}: ${error.message}`);
          result.success = false;
          
          // Stop execution on first failure
          break;
        }
      }

    } catch (error) {
      this.logger.error(`Migration process failed: ${error.message}`);
      result.errors.push(`Migration process: ${error.message}`);
      result.success = false;
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  async rollbackMigrations(count: number = 1): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migrationsExecuted: [],
      errors: [],
      executionTime: 0,
    };

    try {
      const executedMigrations = await this.getExecutedMigrations();
      const migrationsToRollback = executedMigrations
        .filter(m => m.status === 'success')
        .slice(-count)
        .reverse();

      if (migrationsToRollback.length === 0) {
        this.logger.log('No migrations to rollback');
        return result;
      }

      this.logger.log(`Rolling back ${migrationsToRollback.length} migrations`);

      for (const migrationRecord of migrationsToRollback) {
        try {
          // Find the migration definition
          const migration = this.findMigrationByVersion(migrationRecord.version);
          
          if (!migration) {
            throw new Error(`Migration definition not found for version: ${migrationRecord.version}`);
          }

          this.logger.log(`Rolling back migration: ${migration.version} - ${migration.name}`);
          
          const migrationStartTime = Date.now();
          await migration.down(this.dataSource);
          const migrationEndTime = Date.now();
          
          // Remove migration record
          await this.removeMigrationRecord(migration.version);
          
          result.migrationsExecuted.push(migration.version);
          this.logger.log(`Migration ${migration.version} rolled back successfully`);
          
        } catch (error) {
          this.logger.error(`Rollback of migration ${migrationRecord.version} failed: ${error.message}`);
          result.errors.push(`${migrationRecord.version}: ${error.message}`);
          result.success = false;
          break;
        }
      }

    } catch (error) {
      this.logger.error(`Rollback process failed: ${error.message}`);
      result.errors.push(`Rollback process: ${error.message}`);
      result.success = false;
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  private sortMigrations(migrations: Migration[]): Migration[] {
    // Simple topological sort for dependencies
    const sorted: Migration[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (migration: Migration) => {
      if (visiting.has(migration.version)) {
        throw new Error(`Circular dependency detected for migration: ${migration.version}`);
      }
      
      if (visited.has(migration.version)) {
        return;
      }

      visiting.add(migration.version);

      // Visit dependencies first
      if (migration.dependencies) {
        for (const depVersion of migration.dependencies) {
          const depMigration = migrations.find(m => m.version === depVersion);
          if (depMigration) {
            visit(depMigration);
          }
        }
      }

      visiting.delete(migration.version);
      visited.add(migration.version);
      sorted.push(migration);
    };

    for (const migration of migrations) {
      if (!visited.has(migration.version)) {
        visit(migration);
      }
    }

    return sorted;
  }

  private async recordMigration(
    migration: Migration, 
    executionTime: number, 
    status: 'success' | 'failed', 
    error?: string
  ): Promise<void> {
    const query = `
      INSERT INTO ${this.config.tableName} (version, name, execution_time, status, error)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (version) 
      DO UPDATE SET 
        execution_time = $3,
        status = $4,
        error = $5,
        executed_at = CURRENT_TIMESTAMP
    `;

    await this.dataSource.query(query, [
      migration.version,
      migration.name,
      executionTime,
      status,
      error || null,
    ]);
  }

  private async removeMigrationRecord(version: string): Promise<void> {
    const query = `DELETE FROM ${this.config.tableName} WHERE version = $1`;
    await this.dataSource.query(query, [version]);
  }

  private findMigrationByVersion(version: string): Migration | undefined {
    // This would need to be implemented based on how migrations are registered
    // For now, return undefined
    return undefined;
  }

  async getAvailableMigrations(): Promise<Migration[]> {
    // Import all migration files from the migrations directory
    const migrationFiles = [
      // Import the initial schema migration
      require('../../migrations/001_initial_schema').InitialSchema001,
    ];
    
    return migrationFiles.map(MigrationClass => new MigrationClass());
  }

  async getMigrationStatus(): Promise<{
    total: number;
    executed: number;
    pending: number;
    failed: number;
  }> {
    const executedMigrations = await this.getExecutedMigrations();
    const availableMigrations = await this.getAvailableMigrations();
    
    return {
      total: availableMigrations.length,
      executed: executedMigrations.filter(m => m.status === 'success').length,
      pending: availableMigrations.length - executedMigrations.filter(m => m.status === 'success').length,
      failed: executedMigrations.filter(m => m.status === 'failed').length,
    };
  }
} 