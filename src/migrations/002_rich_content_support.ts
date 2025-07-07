import { MigrationInterface, QueryRunner } from 'typeorm';
import { Migration } from '../common/interfaces/migration.interface';

export class RichContentSupport002 implements MigrationInterface, Migration {
  name = 'RichContentSupport002';
  version = '002';
  description = 'Add rich content support with separate text and media columns for questions and options';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add text column to questions table
    await queryRunner.query(`
      ALTER TABLE questions 
      ADD COLUMN "text" TEXT NOT NULL DEFAULT ''
    `);

    // Add media column to questions table
    await queryRunner.query(`
      ALTER TABLE questions 
      ADD COLUMN "media" JSONB
    `);

    // Migrate existing title data to text
    await queryRunner.query(`
      UPDATE questions 
      SET "text" = COALESCE(title, '')
      WHERE "text" = ''
    `);

    // Drop the old title column
    await queryRunner.query(`
      ALTER TABLE questions DROP COLUMN title
    `);

    // Add text column to questionOptions table
    await queryRunner.query(`
      ALTER TABLE "questionOptions" 
      ADD COLUMN "text" TEXT NOT NULL DEFAULT ''
    `);

    // Add media column to questionOptions table
    await queryRunner.query(`
      ALTER TABLE "questionOptions" 
      ADD COLUMN "media" JSONB
    `);

    // Migrate existing text data
    await queryRunner.query(`
      UPDATE "questionOptions" 
      SET "text" = COALESCE(text, '')
      WHERE "text" = ''
    `);

    // Drop the old text column (we need to rename it first to avoid conflict)
    await queryRunner.query(`
      ALTER TABLE "questionOptions" RENAME COLUMN text TO "oldText"
    `);

    await queryRunner.query(`
      ALTER TABLE "questionOptions" DROP COLUMN "oldText"
    `);

    // Add matchWithMedia column to questionOptions table
    await queryRunner.query(`
      ALTER TABLE "questionOptions" 
      ADD COLUMN "matchWithMedia" JSONB
    `);

    // The existing matchWith column remains as TEXT, we just add the new matchWithMedia column
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert matchWithMedia changes
    await queryRunner.query(`
      ALTER TABLE "questionOptions" DROP COLUMN "matchWithMedia"
    `);

    // Revert text and media changes for questionOptions
    await queryRunner.query(`
      ALTER TABLE "questionOptions" 
      ADD COLUMN "oldText" TEXT
    `);

    await queryRunner.query(`
      UPDATE "questionOptions" 
      SET "oldText" = text
    `);

    await queryRunner.query(`
      ALTER TABLE "questionOptions" DROP COLUMN text
    `);

    await queryRunner.query(`
      ALTER TABLE "questionOptions" DROP COLUMN media
    `);

    await queryRunner.query(`
      ALTER TABLE "questionOptions" RENAME COLUMN "oldText" TO text
    `);

    // Revert text and media changes for questions
    await queryRunner.query(`
      ALTER TABLE questions 
      ADD COLUMN title TEXT
    `);

    await queryRunner.query(`
      UPDATE questions 
      SET title = text
    `);

    await queryRunner.query(`
      ALTER TABLE questions DROP COLUMN text
    `);

    await queryRunner.query(`
      ALTER TABLE questions DROP COLUMN media
    `);
  }
} 