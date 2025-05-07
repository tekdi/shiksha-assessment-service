## 📘 Assessment - Database Schema Documentation

---

### 📋 `#__tmt_answers`

Stores possible answers for each question.

| Column        | Type                   | Description                 |
| ------------- | ---------------------- | --------------------------- |
| `id`          | int(11) unsigned PK AI | Unique answer ID            |
| `question_id` | int(11)                | FK to `#__tmt_questions.id` |
| `answer`      | text                   | The answer text             |
| `marks`       | int(3)                 | Marks for this answer       |
| `is_correct`  | tinyint(1)             | 1 = correct, 0 = incorrect  |
| `order`       | int(3)                 | Display order               |
| `comments`    | text                   | Optional comments           |

---

### 📋 `#__tmt_questions`

Stores question definitions.

| Column             | Type                   | Description                      |
| ------------------ | ---------------------- | -------------------------------- |
| `id`               | int(11) unsigned PK AI | Unique question ID               |
| `ordering`         | int(11)                | Display order                    |
| `checked_out`      | int(11)                | Checked-out by user ID           |
| `checked_out_time` | datetime               | Timestamp of checkout            |
| `created_on`       | datetime               | Creation date                    |
| `title`            | text                   | Question title                   |
| `alias`            | varchar(255)           | URL-safe alias                   |
| `description`      | text                   | Full question content            |
| `type`             | varchar(255)           | Question type (MCQ, etc.)        |
| `level`            | varchar(255)           | Difficulty level                 |
| `marks`            | int(3)                 | Marks for the question           |
| `state`            | tinyint(1)             | 1 = active, 0 = inactive         |
| `ideal_time`       | int(3)                 | Suggested solving time (in mins) |
| `gradingtype`      | varchar(255)           | Grading method                   |
| `category_id`      | int(11)                | FK to category table             |
| `created_by`       | int(11)                | User ID who created it           |
| `params`           | text                   | Additional config (JSON/XML)     |

---

### 📋 `#__tmt_tests`

Stores test metadata and settings.

| Column                    | Type                   | Description                        |
| ------------------------- | ---------------------- | ---------------------------------- |
| `id`                      | int(11) unsigned PK AI | Unique test ID                     |
| `parent_id`               | int(11)                | Parent test ID                     |
| `type`                    | varchar(100)           | Type of test (default: 'plain')    |
| `ordering`                | int(11)                | Order in list                      |
| `state`                   | tinyint(1)             | 1 = active, 0 = inactive           |
| `checked_out`             | int(11)                | Checked-out by                     |
| `checked_out_time`        | datetime               | Checkout timestamp                 |
| `created_by`              | int(11)                | Creator ID                         |
| `title`                   | varchar(255)           | Title of the test                  |
| `alias`                   | varchar(255)           | URL-safe identifier                |
| `description`             | text                   | Test description                   |
| `reviewers`               | text                   | List of reviewers                  |
| `show_time`               | tinyint(1)             | Show timer during test             |
| `time_duration`           | int(11)                | Test duration (in minutes)         |
| `show_time_finished`      | tinyint(1)             | Show time when test ends           |
| `time_finished_duration`  | int(11)                | Duration after time end shown      |
| `total_marks`             | int(11)                | Total marks                        |
| `passing_marks`           | int(11)                | Passing score                      |
| `isObjective`             | tinyint(1)             | 1 = objective test, 0 = subjective |
| `created_on`              | datetime               | Creation date                      |
| `modified_on`             | datetime               | Last modified date                 |
| `start_date`              | datetime               | Start datetime                     |
| `end_date`                | datetime               | End datetime                       |
| `termscondi`              | tinyint(1)             | Terms and conditions acknowledged  |
| `answer_sheet`            | tinyint(1)             | Show answer sheet after test       |
| `show_correct_answer`     | tinyint(1)             | Show correct answers               |
| `print_answersheet`       | tinyint(1)             | Allow printing of answersheet      |
| `questions_shuffle`       | tinyint(1)             | Shuffle questions                  |
| `answers_shuffle`         | tinyint(1)             | Shuffle answers                    |
| `gradingtype`             | varchar(15)            | Grading logic                      |
| `show_thankyou_page`      | tinyint(1)             | Show thank-you page                |
| `show_all_questions`      | tinyint(1)             | Show all questions at once         |
| `show_quiz_marks`         | tinyint(1)             | Show quiz marks                    |
| `pagination_limit`        | int(4)                 | Pagination limit per page          |
| `show_questions_overview` | tinyint(1)             | Display overview before submission |
| `image`                   | varchar(255)           | Test cover image                   |

---

### 📋 `#__tmt_tests_answers`

Captures answers submitted by users during tests.

| Column        | Type         | Description                          |
| ------------- | ------------ | ------------------------------------ |
| `id`          | int(11) PK AI| Unique submission ID                 |
| `question_id` | int(11)      | FK to `#__tmt_questions.id`          |
| `user_id`     | int(11)      | ID of the user who answered          |
| `test_id`     | int(11)      | FK to `#__tmt_tests.id`              |
| `invite_id`   | int(11)      | FK to invite reference               |
| `answer`      | text         | Submitted answer                     |
| `anss_order`  | varchar(255) | Order of selected answer (for MCQs) |
| `marks`       | int(11)      | Marks obtained for the answer        |
| `flagged`     | int(1)       | Flag status (0 = no, 1 = flagged)    |

---

### 📋 `#__tmt_tests_attendees`

Tracks test participants and their attempt statuses.

| Column          | Type         | Description                         |
| --------------- | ------------ | ----------------------------------- |
| `id`            | int(11) PK AI| Unique attendee record              |
| `invite_id`     | int(11)      | FK to invite reference              |
| `test_id`       | int(11)      | FK to `#__tmt_tests.id`             |
| `user_id`       | int(11)      | FK to users                         |
| `company_id`    | int(11)      | FK to companies                     |
| `result_status` | varchar(50)  | Status of result (Passed/Failed)   |
| `score`         | int(11)      | Score obtained                      |
| `attempt_status`| tinyint(1)   | 0 = interrupted, 1 = complete, 2 = rejected |
| `review_status` | tinyint(1)   | 0 = draft, 1 = complete              |
| `time_taken`    | int(11)      | Time taken to complete (in seconds) |

---

### 📋 `#__tmt_tests_photo_captures`

Stores photo snapshots captured during the test.

| Column      | Type         | Description                       |
| ----------- | ------------ | --------------------------------- |
| `id`        | int(11) PK AI| Unique capture ID                 |
| `test_id`   | int(11)      | FK to `#__tmt_tests.id`           |
| `user_id`   | int(11)      | User ID                           |
| `invite_id` | int(11)      | FK to invite reference            |
| `image`     | text         | Base64 or path to image           |
| `time`      | datetime     | Timestamp of capture              |

---

### 📋 `#__tmt_tests_questions`

Maps questions to tests and defines their display order and section.

| Column        | Type         | Description                          |
| ------------- | ------------ | ------------------------------------ |
| `id`          | int(11) PK AI| Unique record ID                     |
| `test_id`     | int(11)      | FK to `#__tmt_tests.id`              |
| `question_id` | int(11)      | FK to `#__tmt_questions.id`          |
| `order`       | int(11)      | Display order in the test            |
| `section_id`  | int(11)      | FK to `#__tmt_tests_sections.id`     |
| `is_compulsory` | tinyint(1) | 1 = mandatory, 0 = optional          |

---

### 📋 `#__tmt_tests_reviewers`

Links reviewers to tests.

| Column      | Type         | Description               |
| ----------- | ------------ | ------------------------- |
| `id`        | int(11) PK AI| Unique reviewer ID        |
| `test_id`   | int(11)      | FK to `#__tmt_tests.id`   |
| `user_id`   | int(11)      | Reviewer User ID          |
| `company_id`| int(11)      | Company ID                |

---

### 📋 `#__tmt_answers_image`

Stores images associated with specific answers.

| Column     | Type             | Description                         |
| ---------- | ---------------- | ----------------------------------- |
| `id`       | int(11) PK AI    | Unique image ID                     |
| `a_id`     | int(11) unsigned | FK to `#__tmt_answers.id`           |
| `q_id`     | int(11)          | FK to `#__tmt_questions.id`         |
| `img_title`| mediumtext       | Image title                         |
| `img_path` | mediumtext       | File path or URL                    |

---

### 📋 `#__tmt_questions_image`

Stores images related to questions.

| Column     | Type             | Description                 |
| ---------- | ---------------- | --------------------------- |
| `id`       | int(11) PK AI    | Unique image ID             |
| `q_id`     | int(11) unsigned | FK to `#__tmt_questions.id` |
| `img_title`| mediumtext       | Image title                 |
| `img_path` | mediumtext       | File path or URL            |

---

### 📋 `#__tmt_quiz_rules`

Defines rules for pulling questions into quizzes.

| Column              | Type         | Description                           |
| ------------------- | ------------ | ------------------------------------- |
| `id`                | int(11) PK AI| Unique rule ID                        |
| `quiz_id`           | int(11)      | FK to test/quiz ID                    |
| `section_id`        | int(11)      | FK to section ID                      |
| `name`              | varchar(200) | Name of the rule                      |
| `order`             | int(11)      | Order of rule                         |
| `questions_count`   | int(11)      | Total number of questions in rule     |
| `pull_questions_count` | int(11)   | Number of questions to pull randomly |
| `marks`             | int(11)      | Marks allotted for this rule          |
| `category`          | int(11)      | Question category                     |
| `difficulty_level`  | varchar(50)  | Difficulty level                      |
| `question_type`     | varchar(50)  | Type of question (MCQ, Subjective)    |

---

### 📋 `#__tmt_tests_sections`

Defines sections within a test.

| Column        | Type         | Description                            |
| ------------- | ------------ | -------------------------------------- |
| `id`          | int(11) PK AI| Unique section ID                      |
| `title`       | varchar(255) | Section title                          |
| `description` | text         | Section description                    |
| `test_id`     | int(11)      | FK to `#__tmt_tests.id`                |
| `ordering`    | int(11)      | Display order of section               |
| `state`       | tinyint(1)   | 1 = active, 0 = inactive               |
| `min_questions`| int(11)     | Minimum number of questions required   |
| `max_questions`| int(11)     | Maximum number of questions allowed    |
