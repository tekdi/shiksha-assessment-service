import { Migration } from '../common/interfaces/migration.interface';

/**
 * Converts every column that stores the application user identifier from UUID to VARCHAR(255),
 * so user IDs no longer have to be UUIDs (e.g. "user-123" or an external IdP subject).
 *
 * Only user-identifier columns are touched; entity IDs (testId, attemptId, questionId, tenantId, ...)
 * stay UUID. Existing values are preserved via `USING "<col>"::text` (canonical lowercase UUID text),
 * and indexes on these columns (e.g. idx_test_attempts_user) are rebuilt automatically by Postgres.
 * None of these columns has a foreign key or default value.
 *
 * The statement is idempotent: columns that do not exist or are no longer UUID are skipped.
 * Note: ALTER COLUMN TYPE rewrites each table under an ACCESS EXCLUSIVE lock; run it in a maintenance window.
 */
const USER_ID_COLUMNS: Array<[string, string]> = [
  ['tests', 'createdBy'],
  ['tests', 'updatedBy'],
  ['tests', 'checkedOut'],
  ['questions', 'createdBy'],
  ['questions', 'updatedBy'],
  ['questions', 'checkedOut'],
  ['testSections', 'createdBy'],
  ['testSections', 'updatedBy'],
  ['testRules', 'createdBy'],
  ['testRules', 'updatedBy'],
  ['testAttempts', 'userId'],
  ['testAttempts', 'updatedBy'],
  ['testUserAnswers', 'reviewedBy'],
  ['testUserAnswers', 'updatedBy'],
  ['questionPools', 'createdBy'],
  ['questionPools', 'updatedBy'],
  ['attemptQuestions', 'createdBy'],
  ['attemptQuestions', 'updatedBy'],
  ['testAttemptsReval', 'updatedBy'],
  ['testUserStatus', 'userId'],
];

const targetsSql = USER_ID_COLUMNS.map(([table, column]) => `('${table}', '${column}')`).join(',\n        ');

export class UserIdUuidToVarchar004 implements Migration {
  version = '004';
  name = 'user_id_uuid_to_varchar';
  description = 'Change user identifier columns (userId, createdBy, updatedBy, reviewedBy, checkedOut) from UUID to VARCHAR(255)';

  async up(connection: any): Promise<void> {
    await connection.query(`
      DO $$
      DECLARE
        target RECORD;
      BEGIN
        FOR target IN
          SELECT c.table_name, c.column_name
          FROM information_schema.columns c
          JOIN (VALUES
        ${targetsSql}
          ) AS t(table_name, column_name)
            ON c.table_name = t.table_name AND c.column_name = t.column_name
          WHERE c.table_schema = current_schema()
            AND c.data_type = 'uuid'
        LOOP
          EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I TYPE VARCHAR(255) USING %I::text',
            target.table_name, target.column_name, target.column_name
          );
        END LOOP;
      END $$;
    `);
  }

  /**
   * Reverts to UUID. Fails (and changes nothing) if any non-UUID user ID has been stored since `up` ran.
   */
  async down(connection: any): Promise<void> {
    await connection.query(`
      DO $$
      DECLARE
        target RECORD;
        invalid_count BIGINT;
      BEGIN
        FOR target IN
          SELECT c.table_name, c.column_name
          FROM information_schema.columns c
          JOIN (VALUES
        ${targetsSql}
          ) AS t(table_name, column_name)
            ON c.table_name = t.table_name AND c.column_name = t.column_name
          WHERE c.table_schema = current_schema()
            AND c.data_type = 'character varying'
        LOOP
          EXECUTE format(
            'SELECT count(*) FROM %I WHERE %I IS NOT NULL AND %I !~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''',
            target.table_name, target.column_name, target.column_name
          ) INTO invalid_count;

          IF invalid_count > 0 THEN
            RAISE EXCEPTION 'Cannot revert %.%: % row(s) contain non-UUID user IDs', target.table_name, target.column_name, invalid_count;
          END IF;

          EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING %I::uuid',
            target.table_name, target.column_name, target.column_name
          );
        END LOOP;
      END $$;
    `);
  }
}
