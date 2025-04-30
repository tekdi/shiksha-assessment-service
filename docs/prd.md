# Product Requirements Document (PRD)

This document outlines the requirements for an Assessment Management Module to be integrated into a Learning Management System (LMS). It will be a robust, configurable, and scalable service for creating and managing quizzes/tests within an LMS. It includes quiz creation, question pools, answer handling (with media), scoring, progress tracking, and flexible test behavior settings.

## Scope

### In Scope
- Quiz/Test creation with advanced configuration
- Question bank management
- Multimedia support for questions/answers
- User test-taking flows with progress/resume
- Result evaluation and summary

### Out of Scope
- Certificate issuance (handled by certificate service)
- Course enrollment (handled by course service)
- Authentication & user management

## Key Features

### Quiz Configuration Options
- Fine-grained control over quiz behavior — resume, review, correct answer visibility, thank-you page, print permissions, etc.

### Time Management
- Support for time limits, countdown display, time-finished alerts with custom thresholds.

### Question Management
- Create and manage questions manually or from a question bank. Supports multimedia (image/audio/video) in questions and answers.

### Question Pools & Auto-Pick
- Generate quizzes using dynamic rules from large question banks or pools. Supports rule-based question selection.

### Section-Based Quizzes
- Organize quizzes into sections.

### Customizable User Flow
- Support for question shuffling, pagination, question overview, and multiple quiz layout options.

### Attempt Management
- Users can start, resume, and submit attempts. Incomplete attempts can be resumed if allowed.

### Answer Sheet & Review
- After submission, users may review answer sheets, see correct answers, and print responses if permitted.

### Dynamic Scoring and Passing Logic
- Automatic total and passing mark calculations based on question weights and section configurations.

### Scalability and API-First
- A scalable NestJS microservice with TypeORM, PostgreSQL, and OpenAPI (Swagger) documentation.

### Progress Tracking
- Track user progress across quiz attempts, including resume support and state restoration.

### Multi-Tenancy Support
- Logical data separation, tenant-specific configurations, and scoped API access.

## Target Users

### 1. Learner
**Role**: End-user taking assessments assigned via LMS.  
**Needs**:
- View available quizzes/tests.
- Start, pause, resume, and submit quiz attempts.
- See time left, navigate between questions, and mark questions for review.
- Review their answer sheet after submission (if allowed in quiz config).
- See correct answers and scoring (if allowed in quiz config).
- Print answer sheet (if allowed in quiz config).

### 2. Instructor / Facilitator
**Role**: Content creator and test administrator.  
**Needs**:
- Create quizzes/tests with customizable configurations.
- Create, import, or pick questions from the question bank.
- Set time limits, shuffle settings, and behavior flags.
- Group questions into sections and define rules for scoring.
- Auto-generate quizzes from pools/question banks.
- View analytics on learner performance (overall and section-wise).
- Modify quizzes prior to learners starting them.

### 3. Admin / LMS Manager
**Role**: Super-admin or platform owner responsible for setup, governance, and integrations.  
**Needs**:
- Configure global settings (e.g., max duration, allowed media types).
- Manage question banks and approve content.
- View system-wide reports and analytics.
- Enable/disable plugins (e.g., section-wise analytics, thank-you page).
- Integrate quiz data with other services (certificate, progress, course).
- Monitor quiz completion rates and flag irregularities.

## Functional Requirements

### Quiz Configuration
- Support options like: allow resume, allow review of answer sheet, show correct answers, show thank-you page, and allow printing.
- Enable/disable shuffling of questions and/or answers.
- Choose between all questions on one page or paginated view.
- If all questions are on one page, show a question overview palette.
- Define number of questions per page (if paginated).

### Time Management
- Configurable total time duration.
- Optional countdown timer and customizable time alerts.

### Question Management
- Support text, image, audio, or video in questions and answers.
- Question types supported: single/multiple choice, true/false, short answer.
- Manual or auto-pick from question bank.
- Define question marks and total/passing marks.

### Section and Pool Management
- Create sections with independent scoring.
- Define pools and dynamic rules to auto-pick questions into quizzes.

### Attempt Management
- Start, pause, resume (if allowed).
- Auto-save at regular intervals or real-time.
- Submit quiz manually or on timeout.
- Partial submission support during connectivity issues.

### Result & Review
- Post-attempt performance summary.
- Review answers, show correct answers (if allowed), print responses.
- Show thank-you page if configured.

### Analytics and Feedback
- View learner performance analytics.
- Section-wise breakdown (if applicable).
- Export and access data via APIs.

## Non-Functional Requirements

- Built with NestJS, PostgreSQL, and TypeORM
- RESTful APIs documented using Swagger/OpenAPI
- Scalable to handle millions of quiz attempts
- Question randomization and adaptive rules support

## Technical Requirements

### 1. Architecture & Framework
- NestJS microservice with modular design
- Stateless and horizontally scalable
- RESTful APIs with Swagger/OpenAPI docs

### 2. Database & Persistence
- PostgreSQL + TypeORM
- Use UUIDs for primary keys
- Migration support

### 3. Authentication & Authorization
- JWT-based auth via shared auth microservice
- Role-based access control per endpoint

### 4. Question Media Support
- Support image/audio/video in questions/answers
- Store file URLs in DB, files in external storage (e.g., S3)
- Validate uploads

### 5. Supported Question Types
- **Multiple Choice – Single Correct**
- **Multiple Choice – Multiple Correct**
- **True/False**
- **Short Answer**
- **Descriptive/Essay**
- **Match the Following** *(Future)*
- **Ordering/Sequence** *(Future)*
- **Fill in the Blanks** *(Future)*
- **Media-based** (audio/image/video questions and options)

### 6. Attempt State Management
- Auto-save state, progress, time, flags
- Resume must restore complete state

### 7. Multi-Tenancy Support
- `tenantId` via header or JWT
- Data isolation and scoped configs
- API filtering per tenant
- Row-level or schema-level segregation (based on scale)

### 8. Performance & Scalability
- Concurrent usage support (thousands+)
- Caching for quiz/question config
- Async processing via Redis/RabbitMQ

### 9. Configuration & Flexibility
- Configurable quiz behavior per quiz/section
- Support rules for dynamic quiz generation

### 10. Progress Tracking & Scoring
- Automatic mark calculations
- Persist and expose learner scores and history

### 11. Analytics & Reporting
- APIs for overall and section-level analytics
- Integration-ready reporting support

### 12. DevOps & Monitoring
- Dockerized services
- Health/readiness checks
- Prometheus metrics support
- Env-based config

### 13. Testing & Quality
- ≥80% unit test coverage
- API tests for major flows
- Use ESLint, Prettier, TypeScript
