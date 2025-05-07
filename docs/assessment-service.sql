CREATE TABLE "questions"(
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "ordering" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "alias" VARCHAR(255) NOT NULL,
    "description" TEXT NULL,
    "category_id" UUID NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "level" VARCHAR(255) NOT NULL,
    "marks" INTEGER NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'published',
    "ideal_time" INTEGER NOT NULL,
    "gradingtype" VARCHAR(255) NOT NULL DEFAULT 'quiz',
    "params" jsonb NULL,
    "media_type" TEXT NOT NULL,
    "media_id" UUID NOT NULL,
    "checked_out" BOOLEAN NULL,
    "checked_out_time" TIMESTAMP(0) WITH TIME zone NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(0) WITH TIME zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" UUID NOT NULL,
    "updatedAt" TIMESTAMP(0) WITH TIME zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "questions" ADD PRIMARY KEY("id");

CREATE TABLE "answers"(
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "order" INTEGER NOT NULL,
    "comments" TEXT NULL,
    "media_type" TEXT NOT NULL,
    "media_id" UUID NOT NULL
);
ALTER TABLE "answers" ADD PRIMARY KEY("id");

CREATE TABLE "test_sections" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "test_id" UUID NOT NULL,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT TRUE,
    "min_questions" INTEGER NOT NULL DEFAULT 0,
    "max_questions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_test_sections" PRIMARY KEY ("id"),
    CONSTRAINT "fk_test_sections_test" FOREIGN KEY ("test_id") REFERENCES "test"("id")
);

-- Indexes
CREATE INDEX "idx_test_sections_test_id" ON "test_sections" ("test_id");
CREATE INDEX "idx_test_sections_status" ON "test_sections" ("status");


CREATE TABLE "test"(
    "id" UUID NOT NULL,
    "parent_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "tenant_id" UUID NOT NULL,
    "ordering" INTEGER NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'published',
    "title" VARCHAR(255) NOT NULL,
    "alias" VARCHAR(255) NOT NULL,
    "description" TEXT NULL,
    "reviewers" TEXT NULL,
    "show_time" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "time_duration" INTEGER NOT NULL,
    "show_time_finished" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "time_finished_duration" INTEGER NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "passing_marks" INTEGER NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "start_date" TIMESTAMP(0) WITH TIME zone NOT NULL,
    "end_date" TIMESTAMP(0) WITH TIME zone NOT NULL,
    "answer_sheet" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "show_correct_answer" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "print_answersheet" BOOLEAN NOT NULL DEFAULT 'DEFAULT TRUE',
    "questions_shuffle" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "answers_shuffle" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "gradingtype" VARCHAR(15) NOT NULL,
    "show_thankyou_page" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "show_all_questions" BOOLEAN NULL DEFAULT 'DEFAULT FALSE',
    "pagination_limit" INTEGER NOT NULL,
    "show_questions_overview" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "checked_out" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE',
    "checked_out_time" TIMESTAMP(0) WITH TIME zone NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(0) WITH TIME zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" UUID NOT NULL,
    "updatedAt" TIMESTAMP(0) WITH TIME zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "test" ADD PRIMARY KEY("id");
ALTER TABLE "test" ADD CONSTRAINT "test_alias_unique" UNIQUE("alias");

CREATE TABLE "test_rules" (
    "id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "name" VARCHAR(200),
    "order" INTEGER NOT NULL DEFAULT 0,
    "questions_count" INTEGER NOT NULL DEFAULT 0,
    "pull_questions_count" INTEGER NOT NULL DEFAULT 0,
    "marks" INTEGER NOT NULL DEFAULT 0,
    "category" UUID,
    "difficulty_level" VARCHAR(50),
    "question_type" VARCHAR(50),

    CONSTRAINT "pk_test_rules" PRIMARY KEY ("id"),
    CONSTRAINT "fk_test_rules_test" FOREIGN KEY ("test_id") REFERENCES "test"("id"),
    CONSTRAINT "fk_test_rules_section" FOREIGN KEY ("section_id") REFERENCES "section"("id"),
    CONSTRAINT "fk_test_rules_category" FOREIGN KEY ("category") REFERENCES "category"("id")
);

-- Indexes for commonly filtered fields
CREATE INDEX "idx_test_rules_test_id" ON "test_rules" ("test_id");
CREATE INDEX "idx_test_rules_section_id" ON "test_rules" ("section_id");
CREATE INDEX "idx_test_rules_category" ON "test_rules" ("category");

CREATE TABLE "test_questions"(
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "is_compulsory" BOOLEAN NOT NULL DEFAULT 'DEFAULT FALSE'
);
ALTER TABLE "test_questions" ADD PRIMARY KEY("id");

CREATE TABLE "test_answers"(
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "tracking_id" UUID NOT NULL,
    "answer" TEXT NULL,
    "anss_order" VARCHAR(255) NOT NULL,
    "marks" INTEGER NOT NULL
);
ALTER TABLE "test_answers" ADD PRIMARY KEY("id");

CREATE TABLE "test_tracking"(
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT '1',
    "timestart" TIMESTAMP(0) WITH TIME zone NOT NULL,
    "timeend" TIMESTAMP(0) WITH TIME zone NOT NULL,
    "score" INTEGER NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'started',
    "total_content" DOUBLE PRECISION NOT NULL,
    "current_position" DOUBLE PRECISION NOT NULL,
    "time_spent" INTEGER NOT NULL,
    "updatedBy" UUID NOT NULL,
    "updatedAt" TIMESTAMP(0) WITH TIME zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "test_tracking" ADD PRIMARY KEY("id");

CREATE TABLE "media"(
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" VARCHAR(255) NULL,
    "path" VARCHAR(255) NULL,
    "source" VARCHAR(255) NULL,
    "original_filename" VARCHAR(255) NULL,
    "size" INTEGER NULL,
    "storage" VARCHAR(255) NULL,
    "params" jsonb NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(0) WITH TIME zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "media" ADD PRIMARY KEY("id");


-- Add foreign key constraints
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_question_id_foreign" FOREIGN KEY("question_id") REFERENCES "questions"("id");
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_foreign" FOREIGN KEY("test_id") REFERENCES "test"("id");
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_test_id_foreign" FOREIGN KEY("test_id") REFERENCES "test"("id");
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_foreign" FOREIGN KEY("category_id") REFERENCES "Category"("id");
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_foreign" FOREIGN KEY("question_id") REFERENCES "questions"("id");
ALTER TABLE "questions" ADD CONSTRAINT "questions_media_id_foreign" FOREIGN KEY("media_id") REFERENCES "media"("id");
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_question_id_foreign" FOREIGN KEY("question_id") REFERENCES "questions"("id");
ALTER TABLE "answers" ADD CONSTRAINT "answers_media_id_foreign" FOREIGN KEY("media_id") REFERENCES "media"("id");
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_tracking_id_foreign" FOREIGN KEY("tracking_id") REFERENCES "test_tracking"("id");
ALTER TABLE "test_tracking" ADD CONSTRAINT "test_tracking_test_id_foreign" FOREIGN KEY("test_id") REFERENCES "test"("id");

-- Add indexes for tenant_id to improve query performance
CREATE INDEX "idx_questions_tenant_id" ON "questions"("tenant_id");
CREATE INDEX "idx_answers_tenant_id" ON "answers"("tenant_id");
CREATE INDEX "idx_test_tenant_id" ON "test"("tenant_id");
CREATE INDEX "idx_test_questions_tenant_id" ON "test_questions"("tenant_id");
CREATE INDEX "idx_test_answers_tenant_id" ON "test_answers"("tenant_id");
CREATE INDEX "idx_test_tracking_tenant_id" ON "test_tracking"("tenant_id");
CREATE INDEX "idx_media_tenant_id" ON "media"("tenant_id");
CREATE INDEX "idx_category_tenant_id" ON "Category"("tenant_id");