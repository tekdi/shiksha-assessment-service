This document outlines the requirements for an Assessment Management Module to be integrated into a Learning Management System (LMS). It will be a robust, configurable, and scalable service for creating and managing quizzes/tests within an LMS. It includes quiz creation, question pools, answer handling (with media), scoring, progress tracking, and flexible test behavior settings.
Scope
In Scope
Quiz/Test creation with advanced configuration
Question bank management
Multimedia support for questions/answers
User test-taking flows with progress/resume
Result evaluation and summary


Out of Scope
Certificate issuance (handled by certificate service)
Course enrollment (handled by course service)
Authentication & user management
Key Features
Quiz Configuration Options
 Fine-grained control over quiz behavior — resume, review, correct answer visibility, thank-you page, print permissions, etc.


Time Management
 Support for time limits, countdown display, time-finished alerts with custom thresholds.


Question Management
 Create and manage questions manually or from a question bank. Supports multimedia (image/audio/video) in questions and answers.


Question Pools & Auto-Pick
 Generate quizzes using dynamic rules from large question banks or pools. Supports rule-based question selection.


Section-Based Quizzes
 Organize quizzes into sections..


Customizable User Flow
 Support for question shuffling, pagination, question overview, and multiple quiz layout options.


Attempt Management
 Users can start, resume, and submit attempts. Incomplete attempts can be resumed if allowed.


Answer Sheet & Review
 After submission, users may review answer sheets, see correct answers, and print responses if permitted.


Dynamic Scoring and Passing Logic
 Automatic total and passing mark calculations based on question weights and section configurations.


Scalability and API-First
 A scalable NestJS microservice with TypeORM, PostgreSQL, and OpenAPI (Swagger) documentation.


Progress Tracking: Track user progress across quiz attempts, including resume support and state restoration.


Multi-Tenancy Support: Logical data separation, tenant-specific configurations, and scoped API access.
Target Users
1. Learner
Role: End-user taking assessments assigned via LMS.
Needs:
View available quizzes/tests.
Start, pause, resume, and submit quiz attempts.
See time left, navigate between questions, and mark questions for review.
Review their answer sheet after submission (if allowed).
See correct answers and scoring (if permitted).
Print answer sheet (if allowed).
2. Instructor / Facilitator
Role: Content creator and test administrator.
Needs:
Create quizzes/tests with customizable configurations.
Create, import, or pick questions from the question bank.
Set time limits, shuffle settings, and behavior flags.
Group questions into sections and define rules for scoring.
Auto-generate quizzes from pools/question banks.
View analytics on learner performance (overall and section-wise).
Modify quizzes prior to learners starting them.


3. Admin / LMS Manager
Role: Super-admin or platform owner responsible for setup, governance, and integrations.
Needs:
Configure global settings (e.g., max duration, allowed media types).
Manage question banks and approve content.
View system-wide reports and analytics.
Enable/disable plugins (e.g., section-wise analytics, thank-you page).
Integrate quiz data with other services (certificate, progress, course).
Monitor quiz completion rates and flag irregularities.
Functional Requirements
Quiz Configuration
The system must allow administrators/instructors to create and configure quizzes.
Quizzes must support options like: allow resume, allow review of answer sheet, show correct answers, show thank-you page, and allow printing.
The system must support enabling/disabling shuffling of questions and/or answers.
Quizzes must allow choosing between all questions on one page or paginated view.
If all questions are shown on one page, the system must support a question overview palette.


The system must allow defining how many questions appear per page (if pagination is used).


Time Management
Each quiz must support a configurable total time duration.
The system must optionally show a time countdown to the learner during the quiz.
The system must optionally alert the user when time is nearly over.
The alert trigger (e.g., 5 minutes before end) must be configurable.
Question Management
Instructors must be able to create and manage questions with support for text, image, audio, or video in both questions and answers.
Questions must support multiple types such as multiple choice (single/multi correct), true/false, and short answer.
Questions can be manually added to quizzes or picked from an existing question bank.
The system must support auto-picking questions based on predefined rules.
Instructors must be able to define marks for each question and set total and passing marks.
Section and Pool Management
The system must allow creation of sections within a quiz.
Sections can contain a group of questions and have their own scoring.
Instructors must be able to generate a pool of questions based on rules.
Quizzes must support dynamically generated content by pulling questions from a pool.
Attempt Management
Learners must be able to start, pause, and resume quiz attempts (if allowed).
The system must save answers in real-time or at regular intervals.
Learners must be able to submit quizzes when completed or when time expires.
The system must support partial submission in case of connectivity loss.


Result & Review
After completion, learners may view a summary of their performance.
The answer sheet may be reviewed by the learner if review is enabled.
Correct answers may be shown if permitted by configuration.
The system must support printing the answer sheet if allowed.
Learners must be shown a thank-you page upon quiz completion if enabled.
Analytics and Feedback
Instructors and admins must be able to view analytics of quiz performance.
Section-wise performance breakdown must be available if sections are used.
The system should support data export and API access for results and metrics.


Non-Functional Requirements
NestJS, PostgreSQL, and TypeORM
REST APIs documented via Swagger/OpenAPI
Scalable to support millions of quiz attempts
Should support question randomization and adaptive rules 


Technical Requirements
1. Architecture & Framework
Must be built as a microservice using Node.js with NestJS framework.
Must follow modular architecture with separation of concerns (e.g., quiz, question, result modules).
Should be stateless and horizontally scalable.
Must expose RESTful APIs with OpenAPI/Swagger documentation.
2. Database & Persistence
Must use PostgreSQL as the relational database.
Use TypeORM for entity modeling and migrations.
Support migrations for schema evolution.
Support UUIDs as primary keys for scalability and global uniqueness.


3. Authentication & Authorization
Must support JWT-based authentication, relying on a shared auth microservice.
Validate user roles (learner, instructor, admin) and permissions via context headers or token claims.
All endpoints must enforce access control (e.g., only creators can edit quizzes, only learners can submit attempts).


4. Question Media Support
Support storing metadata for image, video, and audio attachments in questions and answers.
Use an external file storage service (e.g., S3) and store references (URLs) in the DB.
Uploads must be validated for size, type, and security.
5. Support for Different Question Types
The Assessment Microservice supports a variety of question types to cover different evaluation strategies:
Multiple Choice – Single Correct
One correct answer out of multiple options
Can include text, image, audio, or video as options


Multiple Choice – Multiple Correct
More than one correct answer can be selected


True/False
Simple binary questions (True or False)


Short Answer
Learners type a brief response
Can be auto-evaluated if answer is predefined


Descriptive/Essay
Long-form text answer, requires manual evaluation


Match the Following (Not in V1)
Pairs matching type questions
Drag-and-drop or select-based interface


Ordering/Sequence (Not in V1)
Learners reorder items into correct sequence


Fill in the Blanks  (Not in V1)
Text with placeholders the learner must complete


Media-Based Questions
Questions or options can include:
Image
Audio
Video


For example:


“Listen to this clip and answer the question”
“Identify the object in the image”
6. Attempt State Management
Support real-time auto-saving of quiz attempts.
Store user responses, progress, time remaining, and flags (e.g., marked for review).
Resume must restore quiz state, including pagination and answers.
7. Multi-Tenancy Support
Tenant Identification: All API requests include a tenantId (via header or JWT claim)


Tenant Data Isolation: Quizzes, questions, attempts, and configurations are scoped per tenant
Tenant Configuration: Each tenant can define their own defaults (e.g., default quiz time, max question count)
Optional Schema per Tenant: Depending on scale, multi-schema or row-level tenancy can be supported
API Enforcement: All queries and mutations filtered by tenantId to ensure isolation and integrity
8. Performance & Scalability
Must support thousands of concurrent quiz takers.
Use caching for frequently accessed metadata (e.g., quiz configs, question bank).
Asynchronous tasks (e.g., result processing, analytics updates) should be handled using message queues like Redis or RabbitMQ.


9. Configuration & Flexibility
Quiz configurations (e.g., shuffle, resume allowed) must be stored per quiz and customizable.
Must support section-wise configuration (e.g., titles, instructions, weightage).
Support rule-based generation of dynamic quizzes (from question pools or criteria).


10. Progress Tracking & Scoring
Automatically calculate total marks, passing marks, and performance.
Persist final results including per-question, per-section data.
Expose APIs to fetch learner progress and attempt history.
11. Analytics & Reporting
Must provide APIs for aggregated analytics (overall, section-wise, attempt count).
Optional integration with external reporting services or dashboards.


12. DevOps & Monitoring
Should be containerized using Docker.
Must include health checks (/health) and readiness checks (/ready).
Expose metrics endpoints (e.g., Prometheus compatible) for monitoring.
Use environment-based configurations with .env or a configuration service.
13. Testing & Quality
Unit tests for each service/module with ≥80% coverage.
API integration tests for critical flows (quiz attempt, submission, result calculation).
Use linting, formatting, and type-checking (ESLint, Prettier, TypeScript).
