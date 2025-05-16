# 📘 Assessment Microservice - Database Schema Documentation

---

## 🧾 `tests`

| Column               | Type                     | Description                                |
|----------------------|--------------------------|--------------------------------------------|
| id                   | UUID                     | Primary key                                |
| parentId             | UUID                     | FK to original test (for generated sub-tests)|
| type                 | VARCHAR(255)             | plain, rule_based, generated               |
| tenantId             | UUID                     | Tenant reference                           |
| organisationId       | UUID                     | org reference                              |
| ordering             | INTEGER                  | Display order                              |
| attempts             | INTEGER                  | no of attempts allowed                     |
| attemptsGrading      | TEXT                     | if attempts > 1, logic to calclulate marks |
| status               | TEXT                     | draft, published, unpublished, archived    |
| title                | TEXT                     | Test title                                 |
| alias                | TEXT                     | Optional URL-safe name                     |
| description          | TEXT                     | Optional description                       |
| reviewers            | TEXT                     | User IDs or names                          |
| showTime             | BOOLEAN                  | Show timer                                 |
| timeDuration         | INTEGER                  | Duration in minutes                        |
| showTimeFinished     | BOOLEAN                  | Show when time is up                       |
| timeFinishedDuration | INTEGER                  | Time allowed after end                     |
| totalMarks           | INTEGER                  | Test marks                                 |
| passingMarks         | INTEGER                  | Required to pass                           |
| image                | TEXT                     | Thumbnail                                  |
| startDate            | TIMESTAMP WITH TIME ZONE | Start availability                         |
| endDate              | TIMESTAMP WITH TIME ZONE | End availability                           |
| answerSheet          | BOOLEAN                  | Show full answer sheet after submission    |
| showCorrectAnswer    | BOOLEAN                  | Show correct answers                       |
| printAnswersheet     | BOOLEAN                  | Allow PDF print                            |
| questionsShuffle     | BOOLEAN                  | Shuffle question order                     |
| answersShuffle       | BOOLEAN                  | Shuffle answer options                     |
| gradingType          | TEXT                     | quiz, assignment, feedback                 |
| isObjective          | BOOLEAN                  | if all questions can auto mark             |
| showThankyouPage     | BOOLEAN                  | Show thank you page on submit              |
| showAllQuestions     | BOOLEAN                  | Show all questions at once                 |
| paginationLimit      | INTEGER                  | How many per page if paginated             |
| showQuestionsOverview| BOOLEAN                  | Show index/navigation                      |
| checkedOut           | UUID                     | Locked by user ID                          |
| checkedOutTime       | TIMESTAMP WITH TIME ZONE | Lock time                                  |
| createdBy            | UUID                     | Author                                     |
| createdAt            | TIMESTAMP WITH TIME ZONE | Created on                                 |
| updatedBy            | UUID                     | Last modified by                           |
| updatedAt            | TIMESTAMP WITH TIME ZONE | Last modified on                           |

---

## 🧾 `questions`

| Column             | Type                     | Description                                   |
|--------------------|--------------------------|-----------------------------------------------|
| id                 | UUID                     | Primary key                                   |
| tenantId             | UUID                   | Tenant reference                           |
| organisationId       | UUID                   | org reference                              |
| ordering           | INTEGER                  | Display order                                 |
| title              | TEXT                     | Question title                                |
| alias              | TEXT                     | Unique alias                                  |
| description        | TEXT                     | Optional explanation                          |
| categoryId         | UUID                     | Category reference                            |
| type               | TEXT                     | Question type                                 |
| level              | TEXT                     | Difficulty level                              |
| marks              | INTEGER                  | Marks allocated                               |
| status             | TEXT                     | Draft, published, etc.                        |
| idealTime          | INTEGER                  | Time expected to solve (sec)                  |
| gradingType        | TEXT                     | quiz, exercise                                |
| allowPartialScoring| BOOLEAN                  | Allow partial marking                         |
| params             | JSONB                    | Extra config as JSON                          |
| checkedOut         | UUID                     | User who is editing                           |
| checkedOutTime     | TIMESTAMP WITH TIME ZONE | When checked out                              |
| createdBy          | UUID                     | User who created it                           |
| createdAt          | TIMESTAMP WITH TIME ZONE | Creation timestamp                            |
| updatedBy          | UUID                     | Last user who updated                         |
| updatedAt          | TIMESTAMP WITH TIME ZONE | Last update time                              |

---

## 🧾 `questionOptions`

| Column         | Type           | Description                                                            |
|----------------|----------------|------------------------------------------------------------------------|
| id             | UUID           | Primary key                                                            |
| tenantId       | UUID                     | Tenant reference                           |
| organisationId | UUID                     | org reference                              |
| questionId     | UUID           | Foreign key referencing `question(id)`                                |
| text           | TEXT           | Option text or left side of match                                     |
| matchWith      | TEXT           | Right side of match (only for match-type)                             |
| position       | INTEGER        | Used for ordering options                                             |
| isCorrect      | BOOLEAN        | Indicates if the option is correct                                    |
| marks          | DECIMAL(5,2)   | Marks for the option                                                  |
| blankIndex     | INTEGER        | Index of the blank (for fill-in-the-blanks only)                      |
| caseSensitive  | BOOLEAN        | Case sensitivity for fill-in-the-blank answers                        |
| createdAt      | TIMESTAMP      | Timestamp, default to CURRENT_TIMESTAMP                               |

---

## 🧾 `testSections`

| Column       | Type                     | Description                  |
|--------------|--------------------------|------------------------------|
| id           | UUID                     | Primary key                  |
| tenantId     | UUID                     | Tenant reference                           |
| organisationId| UUID                     | org reference                              |
| title        | TEXT                     | Section title                |
| description  | TEXT                     | Optional description         |
| testId       | UUID                     | Linked test ID               |
| ordering     | INTEGER                  | Display order                |
| status       | TEXT                     | Active/inactive              |
| minQuestions | INTEGER                  | Minimum questions to include |
| maxQuestions | INTEGER                  | Maximum questions to include |
| createdBy    | UUID                     | Author                       |
| createdAt    | TIMESTAMP WITH TIME ZONE | Created on                   |
| updatedBy    | UUID                     | Last modified by             |
| updatedAt    | TIMESTAMP WITH TIME ZONE | Last modified on             |


---

## 🧾 `testQuestions`

| Column         | Type   | Description              |
|----------------|--------|--------------------------|
| id             | UUID   | Primary key              |
| tenantId             | UUID                     | Tenant reference                           |
| organisationId       | UUID                     | org reference                              |
| testId         | UUID   | Associated test          |
| questionId     | UUID   | Related question         |
| questionOrder  | INTEGER| Order of question        |
| sectionId      | UUID   | Related test section     |
| ruleId      | UUID   | optional(for rule-based)     |
| isCompulsory   | BOOLEAN| Mandatory question flag  |

---

## 🧾 `testAttempts`

| Column          | Type                     | Description                                                     |
| ----------------| ------------------------ | --------------------------------------------------------------- |
| attemptId       | UUID                     | Primary key                                                     |
| tenantId             | UUID                     | Tenant reference                           |
| organisationId       | UUID                     | org reference                              |
| testId          | UUID                     | The original test ID user is attempting                                               |
| resolvedTestId  | UUID                     | The actual sub-test ID user is served (optional)                |
| userId          | UUID                     | Attempted by                                                    |
| attempt         | INTEGER                  | Attempt number                                                  |
| startedAt       | TIMESTAMP WITH TIME ZONE | When test started                                               |
| submittedAt     | TIMESTAMP WITH TIME ZONE | When test ended                                                 |
| status          | TEXT                     | `I=in-progress`, `s=Submitted`                                  |
| reviewStatus    | TEXT                     | `P=pending`, `U=under-review`, `R=reviewed`, `N=not-applicable` |
| score           | DECIMAL(5,2)             | Final score (can be null if review pending)                     |
| submissionType  | VARCHAR                  | 'self'=> self-submitted,'auto'=> auto-submitted on timeout      |
| result          | TEXT                     | `P=pass`, `F=fail`                                              |
| currentPosition | INTEGER                  | Where the user left off (if resume allowed)                     |
| timeSpent       | INTEGER                  | Time spent in seconds                                           |
| updatedBy       | UUID                     | Last updated by                                                 |
| updatedAt       | TIMESTAMP WITH TIME ZONE | Timestamp of last update                                        |


## 🧾 `testAttemptsReval`

| Column          | Type                     | Description                                                     |
| ----------------| ------------------------ | --------------------------------------------------------------- |
| attemptRevalId  | UUID                     | Primary key                                                     |
| tenantId             | UUID                     | Tenant reference                           |
| organisationId       | UUID                     | org reference                              |
| attemptId       | INTEGER                  | Attempt number                                                  |
| oldScore        | DECIMAL(5,2)             | score                                                           |
| newScore        | DECIMAL(5,2)             | score                                                           |
| oldResult       | VARCHAR                  | `P=pass`, `F=fail`                                              |
| newResult       | VARCHAR                  |`P=pass`, `F=fail`                                               |
| remarks         | TEXT                     |                                                                 |
| updatedBy       | UUID                     | Last updated by                                                 |
| updatedAt       | TIMESTAMP WITH TIME ZONE | Timestamp of last update                                        |

---

## 🧾 `testUserAnswers`

| Column         | Type      | Description               |
|-------------   |--------   |---------------------------|
| attemptAnsId   | UUID      | Primary key               |
| tenantId             | UUID                     | Tenant reference                           |
| organisationId       | UUID                     | org reference                              |
| attemptId      | UUID      | FK to testTrack           |
| questionId     | UUID      | FK to question            |
| answer         | TEXT      | User's response           |
| score          | DECIMAL   | Score given (if reviewed) |
| reviewedBy     | UUID      | Reviewer                  |
| reviewStatus   | TEXT      | `P=pending`, `R=reviewed` |
| reviewedAt     | TIMESTAMP | When it was reviewed      |
| anssOrder      | TEXT      | Order of selected answers |


---

## 🧾 `testUserStatus`

| Column             | Type                     | Description                                   |
|--------------------|--------------------------|-----------------------------------------------|
| stausId            | UUID                     | Primary key                                   |
| tenantId             | UUID                     | Tenant reference                           |
| organisationId       | UUID                     | org reference                              |
| userId             | UUID                     | FK to user                                    |
| testId             | UUID                     | FK to test                                    |
| allowedAttempts    | INTEGER                  | Max attempts allowed (copied from test)       |
| completedAttempts  | INTEGER                  | No. of completed attempts by user             |
| lastAttemptId      | UUID                     | FK to last attempt made                       |
| lastAttemptStatus  | TEXT                     | Status of last attempt (in-progress, submitted, passed, failed)|
| attemptsGrading    | TEXT                     | Grading logic (first, last, avg, best)        |
| score              | DECIMAL(5,2)             | Latest score (based on grading logic)         |
| result             | TEXT                     | Result of last or computed attempt (P/F)      |
| updatedAt          | TIMESTAMP WITH TIME ZONE | Last update                                   |



## 🧾 `media`

| Column             | Type                     | Description                                |
|--------------------|--------------------------|--------------------------------------------|
| mediaId            | UUID                     | Primary key                                |
| tenantId             | UUID                     | Tenant reference                           |
| organisationId       | UUID                     | org reference                              |
| type               | VARCHAR(255)             | Media type (text, image, video, etc.)      |
| path               | VARCHAR(255)             | Storage path or public URL                 |
| source             | VARCHAR(255)             | Origin (uploaded, generated, etc.)         |
| originalFilename   | VARCHAR(255)             | Original uploaded file name                |
| size               | INTEGER                  | File size in bytes                         |
| storage            | VARCHAR(255)             | Storage backend (local, s3, gcs, etc.)     |
| params             | JSONB                    | Additional metadata                        |
| createdBy          | UUID                     | Creator ID                                 |
| createdAt          | TIMESTAMP WITH TIME ZONE | Created timestamp                          |

---

## 🧾 `mediaMap`

| Column      | Type           | Description                                                        |
|-------------|----------------|--------------------------------------------------------------------|
| mediaMapId  | UUID           | Primary key                                                        |
| mediaId     | UUID           | FK to `testMedia(mediaId)` ON DELETE CASCADE                       |
| tenantId             | UUID                     | Tenant reference                           |
| organisationId       | UUID                     | org reference                              |
| client      | VARCHAR(255)   | Client type (e.g., assessment.question, assessment.answer)         |
| clientId    | UUID           | Target entity ID                                                   |
| usageType   |                |"lhs" or "rhs", "main", "hint", "solution", "response"              |
| isGallery   | BOOLEAN        | If this is part of a gallery                                       |

---

## 🧾 `testRules`

| Column             | Type    | Description                     |
|--------------------|---------|---------------------------------|
| ruleId             | UUID    | Primary key                     |
| testId             | UUID    | Associated test                 |
| tenantId             | UUID                     | Tenant reference                           |
| organisationId       | UUID                     | org reference                              |
| sectionId          | UUID    | Related section                 |
| name               | TEXT    | Rule name                       |
| ordering           | INTEGER | Priority/order of rule          |
| questionsCount     | INTEGER | Number of questions to include  |
| pullQuestionsCount | INTEGER | Pool question count             |
| marks              | INTEGER | Total marks                     |
| category           | TEXT    | Filter category                 |
| difficultyLevel    | TEXT    | Filter difficulty level         |
| questionType       | TEXT    | Filter question type            |
