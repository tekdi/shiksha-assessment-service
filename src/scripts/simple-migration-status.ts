// Add crypto polyfill for Node.js v16
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  globalThis.crypto = crypto;
}

import { DataSource } from 'typeorm';

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
  logging: false,
});

async function showMigrationStatus() {
  console.log('📊 Checking migration status...');
  
  try {
    // Initialize database connection
    await dataSource.initialize();
    console.log('✅ Database connection established');
    
    // Get available migrations
    const availableMigrations = [
    ];
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    console.log('\n📋 Migration Status:');
    console.log(`   Total migrations: ${availableMigrations.length}`);
    console.log(`   Executed: ${executedMigrations.filter(m => m.status === 'success').length}`);
    console.log(`   Pending: ${availableMigrations.length - executedMigrations.filter(m => m.status === 'success').length}`);
    console.log(`   Failed: ${executedMigrations.filter(m => m.status === 'failed').length}`);
    
    if (executedMigrations.length > 0) {
      console.log('\n✅ Executed migrations:');
      executedMigrations.forEach(migration => {
        const statusIcon = migration.status === 'success' ? '✅' : '❌';
        console.log(`   ${statusIcon} ${migration.name} (v${migration.version}) - ${migration.executedAt.toISOString()}`);
        if (migration.status === 'failed' && migration.error) {
          console.log(`      Error: ${migration.error}`);
        }
      });
    }
    
    const pendingCount = availableMigrations.length - executedMigrations.filter(m => m.status === 'success').length;
    if (pendingCount > 0) {
      console.log('\n⏳ Pending migrations:');
      console.log('   (Run "npm run migration:run" to execute pending migrations)');
    }
    
  } catch (error) {
    console.error('❌ Failed to get migration status:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
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

// Run if this file is executed directly
if (require.main === module) {
  showMigrationStatus();
} 