import { DataSource } from 'typeorm';
import { InitialSchema001 } from '../migrations/001_initial_schema';

// Database configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'assessment_db',
  entities: [],
  synchronize: false,
  logging: true,
});

async function runMigrations() {
  console.log('🚀 Starting migration runner...');
  
  try {
    // Initialize database connection
    await dataSource.initialize();
    console.log('✅ Database connection established');
    
    // Create migrations table if it doesn't exist
    await createMigrationsTable();
    
    // Get available migrations
    const availableMigrations = [
      new InitialSchema001(),
    ];
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));
    
    // Filter pending migrations
    const pendingMigrations = availableMigrations.filter(migration => !executedVersions.has(migration.version));
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No migrations to run');
      return;
    }
    
    console.log(`📋 Found ${pendingMigrations.length} migration(s) to run`);
    
    // Run migrations
    for (const migration of pendingMigrations) {
      try {
        console.log(`🔄 Running migration: ${migration.version} - ${migration.name}`);
        
        const startTime = Date.now();
        const queryRunner = dataSource.createQueryRunner();
        await migration.up(queryRunner);
        await queryRunner.release();
        const endTime = Date.now();
        
        // Record successful migration
        await recordMigration(migration, endTime - startTime, 'success');
        
        console.log(`✅ Migration ${migration.version} completed successfully`);
        
      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error.message);
        
        // Record failed migration
        await recordMigration(migration, 0, 'failed', error.message);
        
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

async function createMigrationsTable(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
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
  
  await dataSource.query(query);
  console.log('✅ Migrations table initialized');
}

async function getExecutedMigrations(): Promise<any[]> {
  const query = `SELECT * FROM migrations ORDER BY version ASC`;
  const results = await dataSource.query(query);
  
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

async function recordMigration(
  migration: any, 
  executionTime: number, 
  status: 'success' | 'failed', 
  error?: string
): Promise<void> {
  const query = `
    INSERT INTO migrations (version, name, execution_time, status, error)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (version) 
    DO UPDATE SET 
      execution_time = $3,
      status = $4,
      error = $5,
      executed_at = CURRENT_TIMESTAMP
  `;

  await dataSource.query(query, [
    migration.version,
    migration.name,
    executionTime,
    status,
    error || null,
  ]);
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
} 