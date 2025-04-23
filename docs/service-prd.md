## 📝 Product Requirements Document (PRD) - TMT Microservice

---

### 📌 Overview
The TMT (Test Management Tool) microservice is designed to manage the lifecycle of assessments, including test creation, question management, test taking, scoring, and result reporting. This microservice will be integrated as part of a distributed system and will receive user context and access rights via JWT headers from an upstream API gateway.

---

### 🎯 Objectives
- Provide a robust backend for managing test content and test-taking workflows.
- Support both objective and subjective question types.
- Enable dynamic test composition using configurable rules.
- Facilitate proctoring via photo capture and reviewer-based evaluation.
- Ensure security and access control using JWT-based authentication.

---

### 🔐 Authentication & Access Control
- All requests will be authenticated using JWT headers.
- JWT will include claims like `user_id`, `role`, and `company_id`.
- Role-Based Access Control (RBAC) enforced at route/method level.

---

### ✅ Features

#### 1. Test Management
- Create, update, delete tests
- Clone tests for re-use
- Set metadata: title, description, duration, schedule
- Configure test-level settings (shuffle, grading type, timers)

#### 2. Question Bank Management
- CRUD operations for questions
- Attach images and set metadata (type, level, marks, ideal time)
- Support for MCQ, subjective, and other types

#### 3. Answer Management
- Create/edit/delete possible answers
- Set correct flags and marks per answer
- Attach answer-specific images

#### 4. Test Composition
- Manually assign questions to tests
- Organize questions into sections
- Set order, compulsory flags, shuffle behavior

#### 5. Test Rules
- Define rules to dynamically pull questions
- Rule params: category, difficulty, type, number of questions
- Assign rule-level marks and section bindings

#### 6. Test Participation
- Track user participation using `invite_id`
- Save in-progress and completed attempts
- Record submitted answers and order
- Flag answers during the test

#### 7. Scoring & Evaluation
- Auto-score objective answers
- Subjective answer review workflow
- Reviewer assignment per test
- Track review status: draft, complete, rejected

#### 8. Proctoring
- Periodically capture webcam photos during tests
- Store images with metadata (test ID, timestamp)

#### 9. Result & Reporting
- Calculate total score, pass/fail
- Result visibility configuration (e.g. show answer sheet, show correct answers)
- Export support for results (CSV, JSON)

#### 10. Test Configuration
- Timer display toggles
- Pagination limits
- Terms & conditions acknowledgement toggle
- Post-test behaviors (e.g. thank-you page)

#### 11. Reviewer Management
- Assign/remove reviewers
- Filter responses for review per reviewer
- Restricted access to review data

#### 12. Logging & Auditing
- Track all changes to tests, questions, and answers
- Store submission and review activity logs

#### 13. Cloning & Versioning (Optional)
- Clone tests or questions with or without relational context
- Maintain original IDs or create new mappings

---

### 📁 Data Models
Refer to [TMT Database Schema Documentation](./db-design.md) for detailed entity structure.
