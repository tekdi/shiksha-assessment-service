## 📝 Product Requirements Document (PRD) - Assessment Microservice

---
## 1. 🎯 Objectives and Goals

To provide a robust, configurable, and scalable service for creating and managing quizzes/tests.
It should: 
- Allow creation of simple and dynamic (rule-based) tests.
- Support multiple question types including multimedia-based.
- Make the test experience flexible (resume, shuffle, review, etc.).
- Provide insights into learner performance by tracking his progress for attempts.
- Work across organizations (multi-tenancy).
- Support multiple languages for UI and test content (multilingual).
- Be scalable and secure for mass use in learning systems.

---
## 2. 🎯 Scope
### 2.1 In scope 
- Quiz/Test creation with advanced configuration
- Question bank management
- Multimedia support for questions/answers
- User test-taking flows with progress/resume
- Result evaluation and summary
- Performance tracking
### 2.2 Out of scope 
- Certificate issuance (handled by certificate service)
- Authentication & user management


## 3. 👥 Target Users

| Role         | Description |
|--------------|-------------|
| **Admin**    | Manages platform, sets global settings, controls tenants. |
| **Instructor** | Creates and configures tests, questions, rules, and analyzes results. |
| **Learner**  | Attempts the tests and reviews performance. |

---

## 4. ✨ Key Features

### 3.1 Test Types
- **Simple Test**: Instructor manually creates sections and assigns questions to them.
- **Rule-based Test**: Each section contains one or more **rules**. A rule defines:
  - Question type(s) (e.g., MCQ, Subjective)
  - Marks (e.g., 2 marks)
  - Difficulty level (e.g., easy)
  - Number of questions to fetch  
  During the attempt, the system dynamically pulls questions from a **question pool** matching the rule.

---

### 3.2 Question Types
- Multiple Choice – Single correct
- Multiple Choice – Multiple correct
- Essay (Long answer)
- Subjective (Short answer)
- Match the Following
- Fill in the Blanks

**Media Support**:
- Questions and options (for MCQ/MTF) can include **images, audio, or video**.

---

### 3.3 Test Features and Settings
Fine-grained control over test behavior
- Resume Test
- Review Answer Sheet
- Show Correct Answers (if review is enabled)
- Thank You Page
- Print Answer Sheet
- Shuffle Questions
- Shuffle Answers
- Show All Questions on One Page
- Question Overview Panel
- Questions Per Page (if paginated)

---

### 3.4 Time Limit Section
- Total Duration
- Countdown Timer
- Alert Before Time Ends
- Minutes Before Alert Shows

---

### 3.5 Question Management
 Create and manage questions manually or from a question bank. Supports multimedia (image/audio/video) in questions and answers.

---

### 3.6 Question Pools & Auto-Pick
 Generate quizzes using dynamic rules from large question banks or pools. Supports rule-based question selection.

---

### 3.5 Add Questions Section
- Total Marks / Passing Marks
- Pick Questions from Bank
- Auto-pick Based on Rules
- Add New Questions on the Fly
- Question Pool Creation and Dynamic Pull
- Section-wise Analytics on Thank You Page

---
### 3.6 Attempt Management
-  Users can start, resume, and submit attempts. Incomplete attempts can be resumed if allowed.Total Marks / Passing Marks
  
---
### 3.7 Answer Sheet & Review
- After submission, users may review answer sheets, see correct answers, and print responses if permitted.

---
### 3.8 Dynamic Scoring and Passing Logic
- Automatic total and passing mark calculations based on question weights and section configurations.

---
### 3.8 Scalability and API-First
-  Built as a scalable NestJS microservice with TypeORM, PostgreSQL, and OpenAPI (Swagger) documentation.
---

## 4. 📖 User Stories / Use Cases

### Instructors
- Create a test manually or dynamically using rules
- Define rules per section
- Analyze performance section-wise

### Learners
- Resume a test if interrupted
- Review answers and see correct ones (if allowed)
- Print answer sheet (if allowed)

### Admins
- Manage tenants (multi-tenant setup)
- Enable multilingual support
- Control access and global settings

---

## 5. ⚙️ Functional Requirements

| Area | Requirement |
|------|-------------|
| Test Creation | Create simple or rule-based tests |
| Section Management | Add/edit sections and assign rules or questions |
| Question Bank | Add/edit questions with tags (type, marks, difficulty) |
| Rules Engine | Define rule-based question picking criteria |
| Test Attempt | Control shuffling, pagination, resume, time tracking |
| Review & Results | Enable answer sheet review, correct answers, thank you page |
| Media Support | Upload and embed images, audio, video |
| Analytics | Section-wise performance on completion |
| Access Control | RBAC: admin, instructor, learner |
| Multilingual | i18n for UI and test content |
| Multi-Tenant | Isolate org-level data and branding |

---

## 6. 🚧 Non-Functional Requirements

| Category | Description |
|----------|-------------|
| Performance | Load tests/questions in under 2 seconds |
| Scalability | Handle thousands of concurrent users |
| Security | JWT, RBAC, data encryption |
| Availability | 99.5% uptime |
| Compliance | GDPR-compliant data handling |
| Accessibility | WCAG 2.1 compatibility |
| Localization | Multi-language support for UI & content |

---

## 7. 🏗 Technical Requirements

| Component | Description |
|-----------|-------------|
| Architecture | Microservices |
| Backend | Node.js + NestJS, PostgreSQL |
| Media Storage | Cloud storage (e.g., AWS S3) |
| APIs | REST, JWT auth |
| CI/CD | Docker, GitHub Actions/GitLab |
| Monitoring | Prometheus + Grafana |
| Optional Integrations | Email/SMS notifications |
| Deployment | Kubernetes-based multi-tenant infrastructure |

---
