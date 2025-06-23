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
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        organisation_id VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        difficulty_level VARCHAR(20) DEFAULT 'medium',
        marks INTEGER DEFAULT 1,
        parameters JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        updated_by VARCHAR(255)
      )
    `);

    // Create question_options table
    await queryRunner.query(`
      CREATE TABLE question_options (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT false,
        marks DECIMAL(5,2) DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tests table
    await queryRunner.query(`
      CREATE TABLE public."tests" (
      testId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "parentId" UUID,
      type VARCHAR(255),
      "tenantId" UUID,
      "organisationId" UUID,
      ordering INTEGER,
      attempts INTEGER,
      "attemptsGrading" TEXT,
      status TEXT,
      title TEXT,
      alias TEXT,
      description TEXT,
      reviewers TEXT,
      "showTime" BOOLEAN,
      "timeDuration" INTEGER,
      "showTimeFinished" BOOLEAN,
      "timeFinishedDuration" INTEGER,
      "totalMarks" INTEGER,
      "passingMarks" INTEGER,
      image TEXT,
      "startDate" TIMESTAMPTZ,
      "endDate" TIMESTAMPTZ,
      "answerSheet" BOOLEAN,
      "showCorrectAnswer" BOOLEAN,
      "printAnswersheet" BOOLEAN,
      "questionsShuffle" BOOLEAN,
      "answersShuffle" BOOLEAN,
      "gradingType" TEXT,
      "isObjective" BOOLEAN,
      "showThankyouPage" BOOLEAN,
      "showAllQuestions" BOOLEAN,
      "paginationLimit" INTEGER,
      "showQuestionsOverview" BOOLEAN,
      "checkedOut" UUID,
      "checkedOutTime" TIMESTAMPTZ,
      "createdBy" UUID,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedBy" UUID,
      "updatedAt" TIMESTAMPTZ DEFAULT now()
  );
    `);

    // Create test_sections table
    await queryRunner.query(`
      CREATE TABLE testSections (
        id SERIAL PRIMARY KEY,
        testId INTEGER REFERENCES tests(testId) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ordering INTEGER DEFAULT 0,
        status INTEGER DEFAULT 0,
        "createdBy" UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" UUID,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create test_rules table
    await queryRunner.query(`
      CREATE TABLE test_rules (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        criteria JSONB NOT NULL,
        selection_strategy VARCHAR(50) DEFAULT 'random',
        question_count INTEGER DEFAULT 1,
        marks_per_question INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

     // Create test_questions table
    await queryRunner.query(`
      CREATE TABLE public."questions" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenantId" UUID,
      "organisationId" UUID,
      ordering INTEGER,
      title TEXT,
      alias TEXT,
      description TEXT,
      "categoryId" UUID,
      type TEXT CHECK (type IN ('mcq', 'multiple_answer', 'true_false', 'fill_blank', 'match', 'subjective', 'essay')),
      level TEXT CHECK (level IN ('easy', 'medium', 'hard')),
      marks INTEGER,
      status TEXT CHECK (status IN ('draft', 'published', 'archived')),
      "idealTime" INTEGER,
      "gradingType" TEXT CHECK ("gradingType" IN ('quiz', 'exercise')),
      "allowPartialScoring" BOOLEAN,
      params JSONB,
      "checkedOut" UUID,
      "checkedOutTime" TIMESTAMPTZ,
      "createdBy" UUID,
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedBy" UUID,
      "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Create test_questions table
    await queryRunner.query(`
      CREATE TABLE testQuestions (
        testQuestionId SERIAL PRIMARY KEY,
        testId INTEGER REFERENCES tests("testId") ON DELETE CASCADE,
        sectionId INTEGER REFERENCES testSections("sectionId") ON DELETE CASCADE,
        questionId INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        ruleId INTEGER REFERENCES test_rules(id) ON DELETE CASCADE,
        ordering INTEGER DEFAULT 0,
        isCompulsory BOOLEAN true
      )
    `);

    // Create test_attempts table
    await queryRunner.query(`
      CREATE TABLE test_attempts (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        resolved_test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        organisation_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'in_progress',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP,
        total_marks INTEGER DEFAULT 0,
        obtained_marks INTEGER DEFAULT 0,
        percentage DECIMAL(5,2) DEFAULT 0,
        is_passed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create test_user_answers table
    await queryRunner.query(`
      CREATE TABLE test_user_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER REFERENCES test_attempts(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        answer_data JSONB,
        is_correct BOOLEAN,
        obtained_marks DECIMAL(5,2) DEFAULT 0,
        review_status VARCHAR(50) DEFAULT 'pending',
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP,
        reviewer_comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    await queryRunner.query(`CREATE INDEX idx_questions_tenant ON questions(tenant_id, organisation_id)`);
    await queryRunner.query(`CREATE INDEX idx_questions_type ON questions(type)`);
    await queryRunner.query(`CREATE INDEX idx_tests_tenant ON tests(tenant_id, organisation_id)`);
    await queryRunner.query(`CREATE INDEX idx_tests_type ON tests(type)`);
    await queryRunner.query(`CREATE INDEX idx_test_attempts_user ON test_attempts(user_id, tenant_id)`);
    await queryRunner.query(`CREATE INDEX idx_test_attempts_status ON test_attempts(status)`);
    await queryRunner.query(`CREATE INDEX idx_test_user_answers_attempt ON test_user_answers(attempt_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS test_user_answers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS test_attempts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS test_questions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS test_rules CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS test_sections CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS tests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS question_options CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS questions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS migration_tracking CASCADE`);
  }
} 