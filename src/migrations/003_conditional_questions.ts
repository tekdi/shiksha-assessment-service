import { MigrationInterface, QueryRunner } from 'typeorm';
import { Migration } from '../common/interfaces/migration.interface';

export class ConditionalQuestions003 implements MigrationInterface, Migration {
  name = 'ConditionalQuestions003';
  version = '003';
  description = 'Add conditional questions support with parent-child relationships and option-question mappings';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add parentId column to questions table for hierarchical relationships
    await queryRunner.query(`
      ALTER TABLE questions 
      ADD COLUMN "parentId" UUID NULL
    `);

    // Add foreign key constraint for self-referencing parent-child relationship
    await queryRunner.query(`
      ALTER TABLE questions 
      ADD CONSTRAINT fk_questions_parent 
      FOREIGN KEY ("parentId") REFERENCES questions("questionId") ON DELETE CASCADE
    `);

    // Add index for performance on parentId lookups
    await queryRunner.query(`
      CREATE INDEX idx_questions_parent ON questions("parentId")
    `);

    // Add isConditional column to testQuestions table
    await queryRunner.query(`
      ALTER TABLE "testQuestions" 
      ADD COLUMN "isConditional" BOOLEAN DEFAULT FALSE
    `);

    // Add index for performance on isConditional lookups
    await queryRunner.query(`
      CREATE INDEX idx_test_questions_conditional ON "testQuestions"("isConditional")
    `);

    // Create optionQuestions table for option-to-question relationships
    await queryRunner.query(`
      CREATE TABLE "optionQuestions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        "optionId" UUID NOT NULL,
        "questionId" UUID NOT NULL,
        "ordering" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT fk_option_questions_option 
          FOREIGN KEY ("optionId") REFERENCES "questionOptions"("questionOptionId") ON DELETE CASCADE,
        CONSTRAINT fk_option_questions_question 
          FOREIGN KEY ("questionId") REFERENCES questions("questionId") ON DELETE CASCADE,
        
        CONSTRAINT uk_option_question UNIQUE ("optionId", "questionId")
      )
    `);

    // Add indexes for optionQuestions table
    await queryRunner.query(`
      CREATE INDEX idx_option_questions_tenant ON "optionQuestions"("tenantId", "organisationId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_option_questions_option ON "optionQuestions"("optionId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_option_questions_question ON "optionQuestions"("questionId")
    `);

    // Add updatedAt trigger for optionQuestions table
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_option_questions_updated_at 
      BEFORE UPDATE ON "optionQuestions" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger and function
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_option_questions_updated_at ON "optionQuestions"
    `);

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_updated_at_column()
    `);

    // Drop optionQuestions table and its indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_option_questions_question
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_option_questions_option
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_option_questions_tenant
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "optionQuestions"
    `);

    // Drop isConditional column and its index from testQuestions
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_test_questions_conditional
    `);

    await queryRunner.query(`
      ALTER TABLE "testQuestions" DROP COLUMN IF EXISTS "isConditional"
    `);

    // Drop parentId column and its constraints/indexes from questions
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_questions_parent
    `);

    await queryRunner.query(`
      ALTER TABLE questions DROP CONSTRAINT IF EXISTS fk_questions_parent
    `);

    await queryRunner.query(`
      ALTER TABLE questions DROP COLUMN IF EXISTS "parentId"
    `);
  }
}