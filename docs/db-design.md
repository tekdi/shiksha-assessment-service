# 📘 Assessment Microservice - Database Design

## 🏗️ **Database Schema Overview**

The assessment service uses PostgreSQL with TypeORM for data persistence. All tables support multi-tenancy with `tenantId` and `organisationId` columns.

---

## 📋 **Core Tables**

### 🧾 `tests`
| Column            | Type                     | Description                                      |
|-------------------|--------------------------|--------------------------------------------------|
| id                | UUID                     | Primary key                                      |
| parentId          | UUID                     | Parent test ID (for generated tests)             |
| type              | VARCHAR(255)             | Test type: plain, rule_based, generated          |
| tenantId          | UUID                     | Tenant reference                                 |
| organisationId    | UUID                     | Org reference                                    |
| ordering          | INTEGER                  | Display order                                    |
| attempts          | INTEGER                  | Maximum attempts allowed                         |
| attemptsGrading   | TEXT                     | Grading strategy for multiple attempts           |
| status            | TEXT                     | draft, published, unpublished, archived          |
| title             | TEXT                     | Test title                                       |
| alias             | TEXT                     | Test alias                                       |
| description       | TEXT                     | Test description                                 |
| reviewers         | TEXT                     | Assigned reviewers                               |
| showTime          | BOOLEAN                  | Show time limit                                  |
| timeDuration      | INTEGER                  | Time limit in minutes                            |
| showTimeFinished  | BOOLEAN                  | Show time when finished                          |
| timeFinishedDuration | INTEGER              | Time to show after completion                     |
| totalMarks        | INTEGER                  | Total marks                                      |
| passingMarks      | INTEGER                  | Passing marks threshold                          |
| image             | TEXT                     | Test image URL                                   |
| startDate         | TIMESTAMP WITH TIME ZONE | Test start date                                  |
| endDate           | TIMESTAMP WITH TIME ZONE | Test end date                                    |
| answerSheet       | BOOLEAN                  | Show answer sheet                                |
| showCorrectAnswer | BOOLEAN                  | Show correct answers                              |
| printAnswersheet  | BOOLEAN                  | Allow answer sheet printing                       |
| questionsShuffle  | BOOLEAN                  | Shuffle questions                                |
| answersShuffle    | BOOLEAN                  | Shuffle answer options                            |
| gradingType       | TEXT                     | quiz, assignment, feedback                       |
| isObjective       | BOOLEAN                  | Is objective test                                |
| showThankyouPage  | BOOLEAN                  | Show thank you page                              |
| showAllQuestions  | BOOLEAN                  | Show all questions at once                       |
| paginationLimit   | INTEGER                  | Questions per page                               |
| showQuestionsOverview | BOOLEAN              | Show questions overview                          |
| checkedOut        | UUID                     | Checked out by user                              |
| checkedOutTime    | TIMESTAMP WITH TIME ZONE | Checkout time                                    |
| createdBy         | UUID                     | Author                                           |
| createdAt         | TIMESTAMP WITH TIME ZONE | Created on                                       |
| updatedBy         | UUID                     | Last modified by                                 |
| updatedAt         | TIMESTAMP WITH TIME ZONE | Last modified on                                 |

### 🧾 `testSections`
| Column            | Type                     | Description                                      |
|-------------------|--------------------------|--------------------------------------------------|
| id                | UUID                     | Primary key                                      |
| tenantId          | UUID                     | Tenant reference                                 |
| organisationId    | UUID                     | Org reference                                    |
| testId            | UUID                     | Linked test ID                                   |
| name              | TEXT                     | Section name                                     |
| description       | TEXT                     | Section description                              |
| ordering          | INTEGER                  | Section order                                    |
| isActive          | BOOLEAN                  | Is section active                                |
| createdBy         | UUID                     | Author                                           |
| createdAt         | TIMESTAMP WITH TIME ZONE | Created on                                       |
| updatedBy         | UUID                     | Last modified by                                 |
| updatedAt         | TIMESTAMP WITH TIME ZONE | Last modified on                                 |

### 🧾 `testQuestions`
| Column            | Type                     | Description                                      |
|-------------------|--------------------------|--------------------------------------------------|
| id                | UUID                     | Primary key                                      |
| tenantId          | UUID                     | Tenant reference                                 |
| organisationId    | UUID                     | Org reference                                    |
| testId            | UUID                     | Linked test ID                                   |
| questionId        | UUID                     | Linked question ID                               |
| questionOrder     | INTEGER                  | Question order                                   |
| sectionId         | UUID                     | Linked section ID (nullable)                     |
| ruleId            | UUID                     | **NEW** - Linked rule ID for rule-based tests   |
| isCompulsory      | BOOLEAN                  | Is question compulsory                           |

### 🧾 `testRules`
| Column            | Type                     | Description                                      |
|-------------------|--------------------------|--------------------------------------------------|
| id                | UUID                     | Primary key                                      |
| tenantId          | UUID                     | Tenant reference                                 |
| organisationId    | UUID                     | Org reference                                    |
| name              | TEXT                     | Rule name                                        |
| description       | TEXT                     | Optional description                             |
| ruleType          | TEXT                     | Rule type (category_based, difficulty_based, etc.)|
| testId            | UUID                     | Linked test ID (nullable)                        |
| sectionId         | UUID                     | Linked section ID (nullable)                     |
| numberOfQuestions | INTEGER                  | Number of questions to select                    |
| minMarks          | INTEGER                  | Minimum marks (optional)                         |
| maxMarks          | INTEGER                  | Maximum marks (optional)                         |
| selectionStrategy | TEXT                     | random, sequential, weighted                     |
| criteria          | JSONB                    | Rule criteria (categories, levels, types, etc.)  |
| isActive          | BOOLEAN                  | Is rule active                                   |
| priority          | INTEGER                  | Rule priority                                    |
| createdBy         | UUID                     | Author                                           |
| createdAt         | TIMESTAMP WITH TIME ZONE | Created on                                       |
| updatedBy         | UUID                     | Last modified by                                 |
| updatedAt         | TIMESTAMP WITH TIME ZONE | Last modified on                                 |

### 🧾 `testAttempts`
| Column            | Type                     | Description                                      |
|-------------------|--------------------------|--------------------------------------------------|
| attemptId         | UUID                     | Primary key                                      |
| tenantId          | UUID                     | Tenant reference                                 |
| organisationId    | UUID                     | Org reference                                    |
| testId            | UUID                     | Original test ID                                 |
| resolvedTestId    | UUID                     | **NEW** - Generated test ID for rule-based tests |
| userId            | UUID                     | User taking the test                             |
| attempt           | INTEGER                  | Attempt number                                   |
| startedAt         | TIMESTAMP WITH TIME ZONE | When attempt started                             |
| submittedAt       | TIMESTAMP WITH TIME ZONE | When attempt submitted                           |
| status            | TEXT                     | I=in_progress, S=submitted                       |
| reviewStatus      | TEXT                     | P=pending, U=under_review, R=reviewed, N=not_applicable |
| score             | DECIMAL(5,2)             | Final score                                      |
| submissionType    | VARCHAR                  | self, auto                                       |
| result            | TEXT                     | P=pass, F=fail                                   |
| currentPosition   | INTEGER                  | Current question position                        |
| timeSpent         | INTEGER                  | Time spent in seconds                            |
| updatedBy         | UUID                     | Last modified by                                 |
| updatedAt         | TIMESTAMP WITH TIME ZONE | Last modified on                                 |

### 🧾 `testUserAnswers`
| Column            | Type                     | Description                                      |
|-------------------|--------------------------|--------------------------------------------------|
| attemptAnsId      | UUID                     | Primary key                                      |
| tenantId          | UUID                     | Tenant reference                                 |
| organisationId    | UUID                     | Org reference                                    |
| attemptId         | UUID                     | Linked attempt ID                                |
| questionId        | UUID                     | Linked question ID                               |
| answer            | TEXT                     | JSON string containing answer structure          |
| score             | DECIMAL(5,2)             | Score given (if reviewed)                        |
| reviewedBy        | UUID                     | Reviewer                                         |
| reviewStatus      | TEXT                     | P=pending, R=reviewed                            |
| reviewedAt        | TIMESTAMP WITH TIME ZONE | When it was reviewed                             |
| remarks           | TEXT                     | Reviewer comments                                |
| anssOrder         | TEXT                     | Order of answers                                 |
| createdAt         | TIMESTAMP WITH TIME ZONE | Created on                                       |
| updatedBy         | UUID                     | Last modified by                                 |
| updatedAt         | TIMESTAMP WITH TIME ZONE | Last modified on                                 |

### 🧾 `questions`
| Column            | Type                     | Description                                      |
|-------------------|--------------------------|--------------------------------------------------|
| id                | UUID                     | Primary key                                      |
| tenantId          | UUID                     | Tenant reference                                 |
| organisationId    | UUID                     | Org reference                                    |
| ordering          | INTEGER                  | Display order                                    |
| title             | TEXT                     | Question title                                   |
| alias             | TEXT                     | Question alias                                   |
| description       | TEXT                     | Question description                             |
| categoryId        | UUID                     | Category ID                                      |
| type              | TEXT                     | mcq, multiple_answer, true_false, fill_blank, match, subjective, essay |
| level             | TEXT                     | easy, medium, hard                               |
| marks             | INTEGER                  | Marks for this question                          |
| status            | TEXT                     | draft, published, archived                       |
| idealTime         | INTEGER                  | Ideal time in seconds                            |
| gradingType       | TEXT                     | quiz, exercise                                   |
| allowPartialScoring | BOOLEAN                | Allow partial scoring                            |
| params            | JSONB                    | **NEW** - Question parameters (maxLength, rubric, etc.) |
| checkedOut        | UUID                     | Checked out by user                              |
| checkedOutTime    | TIMESTAMP WITH TIME ZONE | Checkout time                                    |
| createdBy         | UUID                     | Author                                           |
| createdAt         | TIMESTAMP WITH TIME ZONE | Created on                                       |
| updatedBy         | UUID                     | Last modified by                                 |
| updatedAt         | TIMESTAMP WITH TIME ZONE | Last modified on                                 |

### 🧾 `questionOptions`
| Column            | Type                     | Description                                      |
|-------------------|--------------------------|--------------------------------------------------|
| id                | UUID                     | Primary key                                      |
| tenantId          | UUID                     | Tenant reference                                 |
| organisationId    | UUID                     | Org reference                                    |
| questionId        | UUID                     | Linked question ID                               |
| text              | TEXT                     | Option text                                      |
| matchWith         | TEXT                     | Match text (for matching questions)              |
| position          | INTEGER                  | Option position                                  |
| isCorrect         | BOOLEAN                  | Is correct answer                                |
| marks             | DECIMAL(5,2)             | Marks for this option                            |
| blankIndex        | INTEGER                  | Blank index (for fill-in-blank)                  |
| caseSensitive     | BOOLEAN                  | Case sensitive matching                          |
| createdAt         | TIMESTAMP                | Created on                                       |

---

## 🔄 **Rule-Based Test Workflow**

### **Test Creation:**
1. Create test with type 'rule_based'
2. Create rules with criteria and selection strategies
3. Add questions to `testQuestions` table with appropriate `ruleId`

### **User Attempt:**
1. User starts attempt on rule-based test
2. System creates new test with type 'generated'
3. System selects questions from `testQuestions` based on rules
4. Selected questions are added to generated test
5. Attempt is linked to generated test via `resolvedTestId`

### **Question Selection Strategies:**
- **Random**: Random selection from available questions
- **Sequential**: First N questions in order
- **Weighted**: Selection based on question weights/difficulty

---

## 🎯 **Question Types & Answer Formats**

### **Supported Question Types:**
- **MCQ**: Single choice with auto-scoring
- **Multiple Answer**: Multiple choice with partial scoring
- **True/False**: Auto-scored
- **Fill-in-Blank**: Auto-scored with case sensitivity
- **Matching**: Auto-scored
- **Subjective**: Manual review with rubric-based scoring
- **Essay**: Manual review with comprehensive rubric

### **Answer Format (JSON):**
```json
{
  "selectedOptionIds": ["opt-1"],           // MCQ/True-False
  "selectedOptionIds": ["opt-1", "opt-3"],  // Multiple Answer
  "text": "Answer text...",                 // Subjective/Essay
  "blanks": ["answer1", "answer2"],         // Fill-in-Blank
  "matches": ["A-1", "B-3"]                 // Matching
}
```

---

## 🔧 **Multi-tenancy & Security**

All tables include:
- `tenantId`: Tenant isolation
- `organisationId`: Organization isolation
- `createdBy`/`updatedBy`: Audit trail
- `createdAt`/`updatedAt`: Timestamp tracking

---

## 📊 **Key Relationships**

```
tests (1) ←→ (N) testSections
tests (1) ←→ (N) testQuestions
testSections (1) ←→ (N) testQuestions
testRules (1) ←→ (N) testQuestions (via ruleId)
testAttempts (1) ←→ (1) tests (generated) (via resolvedTestId)
testUserAnswers (N) ←→ (1) testAttempts
questions (1) ←→ (N) questionOptions
```
