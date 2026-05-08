---
sidebar_position: 3
---

# Getting Started & Installation

Follow these instructions to set up and run the Assessment microservice locally or in a production environment.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16 or higher
- **PostgreSQL**: v12 or higher
- **Redis**: v6 or higher
- **Docker**: (Optional, for containerized setup)

## Local Setup

### 1. Clone the repository

```sh
git clone https://github.com/tekdi/shiksha-assessment-service.git
cd shiksha-assessment-service
```

### 2. Environment Configuration

Create a `.env` file in the root of the project by copying the example:

```bash
cp env.example .env
```

**Required Environment Variables (`.env`):**
Make sure your `.env` contains the following configuration. Update credentials according to your system:

```dotenv
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=assessment_db
DB_SYNCHRONIZE=true

# Redis Configuration
CACHE_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application Configuration
PORT=3000
NODE_ENV=development

# Core Service Dependencies
LMS_SERVICE_URL=http://localhost:4000/lms-service/v1
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup & Initialization

You can set up the database automatically (recommended) or manually. Make sure your `.env` file is configured correctly.

#### Option A: Automatic Application Sync (Easiest)

By simply setting `DB_SYNCHRONIZE=true` in your `.env` file, the service will **automatically create all necessary tables** the first time it starts, matching the schema exactly as defined by the application. *Note: You must still ensure the database itself exists (`CREATE DATABASE assessment_db`).*

#### Option B: Automated Setup Script

If you prefer to initialize the database and install necessary extensions (like `uuid-ossp`) completely automatically (including database creation), run the setup script:

```bash
npm run db:setup
```

**The `db:setup` auto creation script (`scripts/setup-db.sh`) executes the following logic:**
```bash
#!/bin/bash

set -e
echo "🚀 Setting up Shiksha Assessment Service Database..."
source .env

echo "🔍 Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "SELECT 1;"

echo "📝 Creating database '$DB_DATABASE'..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "CREATE DATABASE \"$DB_DATABASE\";"

echo "🔧 Enabling extensions..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"; CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

echo "🏗️  Creating database tables and constraints..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f scripts/schema.sql
echo "✅ Database setup completed successfully!"
```

#### Option C: Manual Database Setup

If you prefer to set up the database manually:

1. **Create Database:**
```sql
CREATE DATABASE assessment_db;
```

2. **Run Initialization Queries:**
```sql
-- Create Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Required Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'testRules_selectionmode_enum') THEN
        CREATE TYPE "testRules_selectionmode_enum" AS ENUM ('PRESELECTED', 'DYNAMIC');
    END IF;
END $$;

-- Table: questions
CREATE TABLE IF NOT EXISTS "questions" (
    "questionId" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenantId" uuid NOT NULL,
    "organisationId" uuid NOT NULL,
    "ordering" integer NOT NULL DEFAULT 0,
    "text" text NOT NULL,
    "media" jsonb,
    "alias" text,
    "description" text,
    "categoryId" uuid,
    "type" text NOT NULL,
    "level" text NOT NULL DEFAULT 'medium',
    "marks" integer NOT NULL DEFAULT 1,
    "status" text NOT NULL DEFAULT 'draft',
    "idealTime" integer,
    "gradingType" text NOT NULL DEFAULT 'quiz',
    "allowPartialScoring" boolean NOT NULL DEFAULT false,
    "params" jsonb,
    "checkedOut" uuid,
    "checkedOutTime" timestamp with time zone,
    "createdBy" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedBy" uuid,
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "parentId" uuid,
    CONSTRAINT "PK_036eeeea243f0e04c4a3deb5216" PRIMARY KEY ("questionId")
);

-- Table: questionOptions
CREATE TABLE IF NOT EXISTS "questionOptions" (
    "questionOptionId" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenantId" uuid NOT NULL,
    "organisationId" uuid NOT NULL,
    "questionId" uuid NOT NULL,
    "text" text NOT NULL,
    "media" jsonb,
    "matchWith" text,
    "matchWithMedia" jsonb,
    "ordering" integer NOT NULL DEFAULT 0,
    "isCorrect" boolean NOT NULL DEFAULT false,
    "marks" numeric NOT NULL DEFAULT 0,
    "blankIndex" integer,
    "caseSensitive" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "ratingValue" integer,
    CONSTRAINT "PK_7d5faa9f7e9b7706e1dd53bf325" PRIMARY KEY ("questionOptionId")
);

-- Table: tests
CREATE TABLE IF NOT EXISTS "tests" (
    "testId" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "parentId" uuid,
    "type" varchar NOT NULL,
    "tenantId" uuid NOT NULL,
    "organisationId" uuid NOT NULL,
    "ordering" integer NOT NULL DEFAULT 0,
    "attempts" integer NOT NULL DEFAULT 1,
    "attemptsGrading" text NOT NULL DEFAULT 'last_attempt',
    "status" text NOT NULL DEFAULT 'draft',
    "title" text NOT NULL,
    "alias" text,
    "description" text,
    "reviewers" text,
    "showTime" boolean NOT NULL DEFAULT false,
    "timeDuration" integer,
    "showTimeFinished" boolean NOT NULL DEFAULT false,
    "timeFinishedDuration" integer,
    "totalMarks" integer NOT NULL DEFAULT 0,
    "passingMarks" integer NOT NULL DEFAULT 0,
    "image" text,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "answerSheet" boolean NOT NULL DEFAULT false,
    "showCorrectAnswer" boolean NOT NULL DEFAULT false,
    "printAnswersheet" boolean NOT NULL DEFAULT false,
    "questionsShuffle" boolean NOT NULL DEFAULT false,
    "answersShuffle" boolean NOT NULL DEFAULT false,
    "gradingType" text NOT NULL DEFAULT 'quiz',
    "isObjective" boolean NOT NULL DEFAULT false,
    "showThankyouPage" boolean NOT NULL DEFAULT false,
    "showAllQuestions" boolean NOT NULL DEFAULT false,
    "paginationLimit" integer,
    "showQuestionsOverview" boolean NOT NULL DEFAULT false,
    "checkedOut" uuid,
    "checkedOutTime" timestamp with time zone,
    "createdBy" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedBy" uuid,
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "allowResubmission" boolean NOT NULL DEFAULT false,
    "contextType" varchar,
    "contextId" uuid,
    CONSTRAINT "PK_44b51741ba0ac81af1fbce473e1" PRIMARY KEY ("testId")
);

-- Table: testSections
CREATE TABLE IF NOT EXISTS "testSections" (
    "sectionId" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenantId" uuid NOT NULL,
    "organisationId" uuid NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "testId" uuid NOT NULL,
    "ordering" integer NOT NULL DEFAULT 0,
    "status" text NOT NULL DEFAULT 'active',
    "minQuestions" integer,
    "maxQuestions" integer,
    "createdBy" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedBy" uuid,
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_f5d0177152475fa309caeae281a" PRIMARY KEY ("sectionId")
);

-- Table: testRules
CREATE TABLE IF NOT EXISTS "testRules" (
    "ruleId" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenantId" uuid NOT NULL,
    "organisationId" uuid NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "ruleType" text NOT NULL,
    "testId" uuid,
    "sectionId" uuid,
    "numberOfQuestions" integer NOT NULL,
    "poolSize" integer NOT NULL,
    "minMarks" integer,
    "maxMarks" integer,
    "selectionStrategy" text NOT NULL DEFAULT 'random',
    "criteria" jsonb NOT NULL,
    "selectionMode" "testRules_selectionmode_enum" NOT NULL DEFAULT 'DYNAMIC',
    "isActive" boolean NOT NULL DEFAULT true,
    "priority" integer NOT NULL DEFAULT 0,
    "createdBy" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedBy" uuid,
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_37e30921aed81c320b103f13576" PRIMARY KEY ("ruleId")
);

-- Table: testQuestions
CREATE TABLE IF NOT EXISTS "testQuestions" (
    "testQuestionId" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenantId" uuid NOT NULL,
    "organisationId" uuid NOT NULL,
    "testId" uuid NOT NULL,
    "questionId" uuid NOT NULL,
    "ordering" integer NOT NULL DEFAULT 0,
    "sectionId" uuid,
    "ruleId" uuid,
    "isCompulsory" boolean NOT NULL DEFAULT false,
    "isConditional" boolean DEFAULT false,
    CONSTRAINT "PK_4b1bd40758d8343034774ec2cdf" PRIMARY KEY ("testQuestionId")
);

-- Table: optionQuestions
CREATE TABLE IF NOT EXISTS "optionQuestions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" uuid NOT NULL,
    "organisationId" uuid NOT NULL,
    "optionId" uuid NOT NULL,
    "questionId" uuid NOT NULL,
    "ordering" integer DEFAULT 0,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT "optionQuestions_pkey" PRIMARY KEY ("id")
);

-- Table: testAttempts
CREATE TABLE IF NOT EXISTS "testAttempts" (
    "attemptId" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenantId" uuid NOT NULL,
    "organisationId" uuid NOT NULL,
    "testId" uuid NOT NULL,
    "resolvedTestId" uuid,
    "userId" uuid NOT NULL,
    "attempt" integer NOT NULL DEFAULT 1,
    "startedAt" timestamp with time zone NOT NULL DEFAULT now(),
    "submittedAt" timestamp with time zone,
    "status" text NOT NULL DEFAULT 'I',
    "reviewStatus" text NOT NULL DEFAULT 'P',
    "score" numeric,
    "submissionType" character varying NOT NULL DEFAULT 'self',
    "result" text,
    "currentPosition" integer,
    "timeSpent" integer,
    "updatedBy" uuid,
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_9900a088dbfa64a03be98c23791" PRIMARY KEY ("attemptId")
);

-- Table: testUserAnswers
CREATE TABLE IF NOT EXISTS "testUserAnswers" (
    "attemptAnsId" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "tenantId" uuid NOT NULL,
    "organisationId" uuid NOT NULL,
    "attemptId" uuid NOT NULL,
    "questionId" uuid NOT NULL,
    "answer" text NOT NULL,
    "score" numeric,
    "reviewedBy" uuid,
    "reviewStatus" text NOT NULL DEFAULT 'P',
    "reviewedAt" timestamp with time zone,
    "remarks" text,
    "anssOrder" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedBy" uuid,
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "PK_761d9f7adfca582fb69d910794b" PRIMARY KEY ("attemptAnsId")
);

-- Foreign Key Constraints
ALTER TABLE "questions" ADD CONSTRAINT "fk_questions_parent" FOREIGN KEY ("parentId") REFERENCES "questions"("questionId");
ALTER TABLE "questionOptions" ADD CONSTRAINT "FK_a1503dbaccabc1f747f4f44e9f4" FOREIGN KEY ("questionId") REFERENCES "questions"("questionId");
ALTER TABLE "tests" ADD CONSTRAINT "FK_41cf85a6c2b918b3c17690ecd93" FOREIGN KEY ("parentId") REFERENCES "tests"("testId");
ALTER TABLE "testSections" ADD CONSTRAINT "FK_4ba46247dee96c3b352e2a5045f" FOREIGN KEY ("testId") REFERENCES "tests"("testId");
ALTER TABLE "testRules" ADD CONSTRAINT "FK_8dd1b92a5b2cad01a323be84ee0" FOREIGN KEY ("sectionId") REFERENCES "testSections"("sectionId");
ALTER TABLE "testRules" ADD CONSTRAINT "FK_97e4513847fc75bb3323d39c5c2" FOREIGN KEY ("testId") REFERENCES "tests"("testId");
ALTER TABLE "testQuestions" ADD CONSTRAINT "FK_24c300e5cc72f1cc38e02c5df31" FOREIGN KEY ("sectionId") REFERENCES "testSections"("sectionId");
ALTER TABLE "testQuestions" ADD CONSTRAINT "FK_cf2cf5af6570029718535ef93ce" FOREIGN KEY ("testId") REFERENCES "tests"("testId");
ALTER TABLE "optionQuestions" ADD CONSTRAINT "fk_option_questions_option" FOREIGN KEY ("optionId") REFERENCES "questionOptions"("questionOptionId");
ALTER TABLE "optionQuestions" ADD CONSTRAINT "fk_option_questions_question" FOREIGN KEY ("questionId") REFERENCES "questions"("questionId");
ALTER TABLE "testAttempts" ADD CONSTRAINT "FK_952e55d19ac289c458d8e3ac427" FOREIGN KEY ("testId") REFERENCES "tests"("testId");
ALTER TABLE "testAttempts" ADD CONSTRAINT "fk_attempts_resolved_test" FOREIGN KEY ("resolvedTestId") REFERENCES "tests"("testId");
ALTER TABLE "testUserAnswers" ADD CONSTRAINT "FK_2a3d2dda99a9bfd350903834e7d" FOREIGN KEY ("attemptId") REFERENCES "testAttempts"("attemptId");

-- Indices
CREATE INDEX IF NOT EXISTS "idx_questions_category_status" ON "questions" ("categoryId", "status", "tenantId");
CREATE INDEX IF NOT EXISTS "idx_questions_created_ordering" ON "questions" ("createdAt" DESC, "tenantId");
CREATE INDEX IF NOT EXISTS "idx_questions_parent" ON "questions" ("parentId");
CREATE INDEX IF NOT EXISTS "idx_questions_status_tenant" ON "questions" ("status", "tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_questions_type_level" ON "questions" ("type", "level", "tenantId");
CREATE INDEX IF NOT EXISTS "idx_questions_question_tenant_org" ON "questions" ("questionId", "tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_questionoptions_questionid_ordering" ON "questionOptions" ("questionId", "ordering");
CREATE INDEX IF NOT EXISTS "idx_tests_created_ordering" ON "tests" ("createdAt" DESC, "tenantId");
CREATE INDEX IF NOT EXISTS "idx_tests_status_tenant" ON "tests" ("status", "tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_tests_testid_tenant_org_status" ON "tests" ("testId", "tenantId", "organisationId", "status");
CREATE INDEX IF NOT EXISTS "idx_test_context" ON "tests" ("contextType", "contextId");
CREATE INDEX IF NOT EXISTS "idx_test_questions_conditional" ON "testQuestions" ("isConditional");
CREATE INDEX IF NOT EXISTS "idx_testquestions_testid_tenant_org_iscompulsory_ordering" ON "testQuestions" ("testId", "tenantId", "organisationId", "isCompulsory", "ordering");
CREATE UNIQUE INDEX IF NOT EXISTS "uk_option_question" ON "optionQuestions" ("optionId", "questionId");
CREATE INDEX IF NOT EXISTS "idx_option_questions_option" ON "optionQuestions" ("optionId");
CREATE INDEX IF NOT EXISTS "idx_option_questions_question" ON "optionQuestions" ("questionId");
CREATE INDEX IF NOT EXISTS "idx_option_questions_tenant" ON "optionQuestions" ("tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_attempts_resolved_test" ON "testAttempts" ("resolvedTestId");
CREATE INDEX IF NOT EXISTS "idx_attempts_started_ordering" ON "testAttempts" ("startedAt" DESC, "tenantId");
CREATE INDEX IF NOT EXISTS "idx_attempts_user_status" ON "testAttempts" ("userId", "status", "tenantId");
CREATE INDEX IF NOT EXISTS "idx_attempts_user_test" ON "testAttempts" ("userId", "testId", "tenantId");
CREATE INDEX IF NOT EXISTS "idx_testattempts_testid_userid_tenant_org_status_attempt" ON "testAttempts" ("testId", "userId", "tenantId", "organisationId", "status", "attempt" DESC);
CREATE INDEX IF NOT EXISTS "idx_testattempts_testid_userid_tenant_org_status_reviewstatus" ON "testAttempts" ("testId", "userId", "tenantId", "organisationId", "status", "reviewStatus");
CREATE INDEX IF NOT EXISTS "idx_testattempts_attemptid_userid_tenant_org" ON "testAttempts" ("attemptId", "userId", "tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_testattempts_attemptid_tenant_org" ON "testAttempts" ("attemptId", "tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_user_answers_question" ON "testUserAnswers" ("questionId");
CREATE INDEX IF NOT EXISTS "idx_testuseranswers_attempt_tenant_org" ON "testUserAnswers" ("attemptId", "tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_testuseranswers_attempt_question_tenant_org" ON "testUserAnswers" ("attemptId", "questionId", "tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_testuseranswers_attempt_tenant_org_createdat" ON "testUserAnswers" ("attemptId", "tenantId", "organisationId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_testuseranswers_attemptid_questionid_tenant_org" ON "testUserAnswers" ("attemptId", "questionId", "tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_testuseranswers_attemptid_tenant_org_score" ON "testUserAnswers" ("attemptId", "tenantId", "organisationId", "score");
CREATE INDEX IF NOT EXISTS "idx_testuseranswers_attemptid_tenant_org" ON "testUserAnswers" ("attemptId", "tenantId", "organisationId");
CREATE INDEX IF NOT EXISTS "idx_testuseranswers_attemptid_tenant_org_createdat" ON "testUserAnswers" ("attemptId", "tenantId", "organisationId", "createdAt");
```

### 5. Start the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 🔐 Note on Authorization
This service relies on headers for user context and multi-tenancy. When testing locally, ensure you include `tenantId`, `organisationId`, and `userId` in your request headers. See [API_USAGE_EXAMPLES.md](../API_USAGE_EXAMPLES.md) for details.

## Docker Configuration

For a quick setup using Docker Compose:

1. **Build and start all services**:

   ```bash
   docker-compose up --build -d
   ```

   This will start the Assessment service, PostgreSQL, and Redis in containers.

2. **Verify the installation**:
   The service should be accessible at `http://localhost:3000` (or the port specified in your `.env`).
   Access the Swagger documentation at `http://localhost:3000/api-docs`.

## Steps for Server Side Setup

For a production server setup, it is recommended to use Docker for consistent orchestration. Refer to the **Docker Configuration** section above. Alternatively, ensure Node.js, PostgreSQL, and Redis are installed on the server and follow the Local Setup steps.
