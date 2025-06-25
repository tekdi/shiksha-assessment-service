import { MigrationInterface, QueryRunner } from 'typeorm';
import { Migration } from '../common/interfaces/migration.interface';

export class InitialSchema001 implements MigrationInterface, Migration {
  name = 'InitialSchema001';
  version = '001';
  description = 'Initial database schema with all tables';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create questions table
    await queryRunner.query(`
      CREATE TABLE questions (
        "questionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        ordering INTEGER DEFAULT 0,
        title TEXT NOT NULL,
        alias TEXT,
        description TEXT,
        "categoryId" UUID,
        type TEXT CHECK (type IN ('mcq', 'multiple_answer', 'true_false', 'fill_blank', 'match', 'subjective', 'essay')),
        level TEXT CHECK (level IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
        marks INTEGER DEFAULT 1,
        status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
        "idealTime" INTEGER,
        "gradingType" TEXT CHECK ("gradingType" IN ('quiz', 'exercise')) DEFAULT 'quiz',
        "allowPartialScoring" BOOLEAN DEFAULT false,
        params JSONB,
        "checkedOut" UUID,
        "checkedOutTime" TIMESTAMPTZ,
        "createdBy" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedBy" UUID,
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create question_options table
    await queryRunner.query(`
      CREATE TABLE "questionOptions" (
        "questionOptionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        "questionId" UUID REFERENCES questions("questionId") ON DELETE CASCADE,
        text TEXT NOT NULL,
        "matchWith" TEXT,
        position INTEGER DEFAULT 0,
        "isCorrect" BOOLEAN DEFAULT false,
        marks DECIMAL(5,2) DEFAULT 0,
        "blankIndex" INTEGER,
        "caseSensitive" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tests table
    await queryRunner.query(`
      CREATE TABLE tests (
        "testId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "parentId" UUID,
        type VARCHAR(255),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        ordering INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 1,
        "attemptsGrading" TEXT,
        status TEXT DEFAULT 'draft',
        title TEXT NOT NULL,
        alias TEXT,
        description TEXT,
        reviewers TEXT,
        "showTime" BOOLEAN DEFAULT false,
        "timeDuration" INTEGER,
        "showTimeFinished" BOOLEAN DEFAULT false,
        "timeFinishedDuration" INTEGER,
        "totalMarks" INTEGER DEFAULT 0,
        "passingMarks" INTEGER DEFAULT 0,
        image TEXT,
        "startDate" TIMESTAMPTZ,
        "endDate" TIMESTAMPTZ,
        "answerSheet" BOOLEAN DEFAULT false,
        "showCorrectAnswer" BOOLEAN DEFAULT false,
        "printAnswersheet" BOOLEAN DEFAULT false,
        "questionsShuffle" BOOLEAN DEFAULT false,
        "answersShuffle" BOOLEAN DEFAULT false,
        "gradingType" TEXT DEFAULT 'quiz',
        "isObjective" BOOLEAN DEFAULT false,
        "showThankyouPage" BOOLEAN DEFAULT false,
        "showAllQuestions" BOOLEAN DEFAULT false,
        "paginationLimit" INTEGER,
        "showQuestionsOverview" BOOLEAN DEFAULT false,
        "checkedOut" UUID,
        "checkedOutTime" TIMESTAMPTZ,
        "createdBy" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedBy" UUID,
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create test_sections table
    await queryRunner.query(`
      CREATE TABLE "testSections" (
        "sectionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        "testId" UUID REFERENCES tests("testId") ON DELETE CASCADE,
        ordering INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        "minQuestions" INTEGER,
        "maxQuestions" INTEGER,
        "createdBy" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedBy" UUID,
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create test_rules table
    await queryRunner.query(`
      CREATE TABLE "testRules" (
        "ruleId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        "ruleType" TEXT NOT NULL,
        "testId" UUID REFERENCES tests("testId") ON DELETE CASCADE,
        "sectionId" UUID REFERENCES "testSections"("sectionId") ON DELETE CASCADE,
        "numberOfQuestions" INTEGER NOT NULL,
        "poolSize" INTEGER NOT NULL,
        "minMarks" INTEGER,
        "maxMarks" INTEGER,
        "selectionStrategy" TEXT DEFAULT 'random',
        criteria JSONB NOT NULL,
        "selectionMode" TEXT DEFAULT 'DYNAMIC',
        "isActive" BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0,
        "createdBy" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedBy" UUID,
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create test_questions table
    await queryRunner.query(`
      CREATE TABLE "testQuestions" (
        "testQuestionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        "testId" UUID REFERENCES tests("testId") ON DELETE CASCADE,
        "questionId" UUID REFERENCES questions("questionId") ON DELETE CASCADE,
        ordering INTEGER DEFAULT 0,
        "sectionId" UUID REFERENCES "testSections"("sectionId") ON DELETE CASCADE,
        "ruleId" UUID REFERENCES "testRules"("ruleId") ON DELETE CASCADE,
        "isCompulsory" BOOLEAN DEFAULT false
      )
    `);

    // Create test_attempts table
    await queryRunner.query(`
      CREATE TABLE "testAttempts" (
        "attemptId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        "testId" UUID REFERENCES tests("testId") ON DELETE CASCADE,
        "resolvedTestId" UUID REFERENCES tests("testId") ON DELETE CASCADE,
        "userId" UUID NOT NULL,
        attempt INTEGER DEFAULT 1,
        "startedAt" TIMESTAMPTZ DEFAULT now(),
        "submittedAt" TIMESTAMPTZ,
        status TEXT DEFAULT 'I',
        "reviewStatus" TEXT DEFAULT 'N',
        score DECIMAL(5,2),
        "submissionType" TEXT DEFAULT 'SELF',
        result TEXT,
        "currentPosition" INTEGER,
        "timeSpent" INTEGER,
        "updatedBy" UUID,
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create test_user_answers table
    await queryRunner.query(`
      CREATE TABLE "testUserAnswers" (
        "attemptAnsId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        "attemptId" UUID REFERENCES "testAttempts"("attemptId") ON DELETE CASCADE,
        "questionId" UUID REFERENCES questions("questionId") ON DELETE CASCADE,
        answer TEXT NOT NULL,
        score DECIMAL(5,2),
        "reviewedBy" UUID,
        "reviewedAt" TIMESTAMPTZ,
        "reviewStatus" TEXT DEFAULT 'P',
        remarks TEXT,
        "anssOrder" TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedBy" UUID,
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create question_pools table
    await queryRunner.query(`
      CREATE TABLE "questionPools" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        "testId" UUID REFERENCES tests("testId") ON DELETE CASCADE,
        "sectionId" UUID REFERENCES "testSections"("sectionId") ON DELETE CASCADE,
        "ruleId" UUID REFERENCES "testRules"("ruleId") ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        "questionIds" JSONB NOT NULL,
        "totalQuestions" INTEGER NOT NULL,
        "totalMarks" INTEGER NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "generatedAt" TIMESTAMPTZ DEFAULT now(),
        "expiresAt" TIMESTAMPTZ,
        "createdBy" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedBy" UUID,
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create attempt_questions table
    await queryRunner.query(`
      CREATE TABLE "attemptQuestions" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        "organisationId" UUID NOT NULL,
        "attemptId" UUID REFERENCES "testAttempts"("attemptId") ON DELETE CASCADE,
        "questionId" UUID REFERENCES questions("questionId") ON DELETE CASCADE,
        "questionOrder" INTEGER NOT NULL,
        "sectionId" UUID REFERENCES "testSections"("sectionId") ON DELETE CASCADE,
        "ruleId" UUID REFERENCES "testRules"("ruleId") ON DELETE CASCADE,
        marks INTEGER NOT NULL,
        "isCompulsory" BOOLEAN DEFAULT false,
        "servedAt" TIMESTAMPTZ DEFAULT now(),
        "createdBy" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedBy" UUID,
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create migration_tracking table
    await queryRunner.query(`
      CREATE TABLE migration_tracking (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        status VARCHAR(20) DEFAULT 'success',
        error_message TEXT
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX idx_questions_tenant ON questions("tenantId", "organisationId")`);
    await queryRunner.query(`CREATE INDEX idx_questions_type ON questions(type)`);
    await queryRunner.query(`CREATE INDEX idx_tests_tenant ON tests("tenantId", "organisationId")`);
    await queryRunner.query(`CREATE INDEX idx_tests_type ON tests(type)`);
    await queryRunner.query(`CREATE INDEX idx_test_attempts_user ON "testAttempts"("userId", "tenantId")`);
    await queryRunner.query(`CREATE INDEX idx_test_attempts_status ON "testAttempts"(status)`);
    await queryRunner.query(`CREATE INDEX idx_test_user_answers_attempt ON "testUserAnswers"("attemptId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "attemptQuestions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questionPools" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testUserAnswers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testAttempts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testQuestions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testRules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testSections" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS tests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questionOptions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS questions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS migration_tracking CASCADE`);
  }
} 