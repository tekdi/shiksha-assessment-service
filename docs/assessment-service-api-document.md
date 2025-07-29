# Assessment Service API Documentation

## Table of Contents 📑

1. [Overview](#overview)
   - [Base URL and Authentication](#base-url-and-authentication)
   - [Common Response Format](#common-response-format)
   - [Error Handling](#error-handling)

2. [Health](#health)
   - [Health Check](#health-check)

3. [Tests](#tests)
   - [Create Test](#create-test)
   - [Get All Tests](#get-all-tests)
   - [Get Test by ID](#get-test-by-id)
   - [Get Test Hierarchy](#get-test-hierarchy)
   - [Update Test](#update-test)
   - [Delete Test](#delete-test)
   - [Add Question to Test](#add-question-to-test)
   - [Add Questions Bulk](#add-questions-bulk)
   - [Get User Test Status](#get-user-test-status)
   - [Update Test Structure](#update-test-structure)

4. [Questions](#questions)
   - [Create Question](#create-question)
   - [Get All Questions](#get-all-questions)
   - [Get Question by ID](#get-question-by-id)
   - [Update Question](#update-question)
   - [Delete Question](#delete-question)
   - [Rule Preview](#rule-preview)

5. [Attempts](#attempts)
   - [Start Attempt](#start-attempt)
   - [Resume Attempt](#resume-attempt)
   - [Get Attempt Questions](#get-attempt-questions)
   - [Submit Answers](#submit-answers)
   - [Submit Attempt](#submit-attempt)
   - [Review Attempt](#review-attempt)
   - [Get Pending Reviews](#get-pending-reviews)

6. [Sections](#sections)
   - [Create Section](#create-section)
   - [Get All Sections](#get-all-sections)
   - [Get Sections by Test](#get-sections-by-test)
   - [Get Section by ID](#get-section-by-id)
   - [Update Section](#update-section)
   - [Delete Section](#delete-section)

7. [Rules](#rules)
   - [Create Rule](#create-rule)
   - [Get All Rules](#get-all-rules)
   - [Get Rule by ID](#get-rule-by-id)
   - [Update Rule](#update-rule)
   - [Delete Rule](#delete-rule)
   - [Get Rules for Test](#get-rules-for-test)
   - [Get Rules for Section](#get-rules-for-section)
   - [Get Rule Preview](#get-rule-preview)
   - [Get Questions by Rule Criteria](#get-questions-by-rule-criteria)

## Overview

**Base URL**: `/assessment/v1`  
**Content-Type**: `application/json`  
**API Version**: 1.0.0

The Assessment Service is a NestJS microservice that manages the entire lifecycle of tests and assessments, including test creation, question management, test attempts, and result evaluation.

### Base URL and Authentication

### Required Headers
All API endpoints require the following headers for multi-tenancy and audit trail:

| Header | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `tenantId` | UUID | Yes | Tenant ID for multi-tenancy | `123e4567-e89b-12d3-a456-426614174000` |
| `organisationId` | UUID | Yes | Organisation ID for multi-tenancy | `123e4567-e89b-12d3-a456-426614174001` |
| `userId` | UUID | Yes | User ID for audit trail | `123e4567-e89b-12d3-a456-426614174002` |

### Authentication Method
- **Bearer Token**: JWT-based authentication (configured in Swagger)
- **Header-based**: Multi-tenancy through required headers

### Common Response Format

### Success Response
```json
{
  "id": "api.test.create",
  "ver": "1.0",
  "ts": "2023-11-02T10:33:23.321Z",
  "params": {
    "resmsgid": "3fc21690-796b-11ee-aa52-8d96a90bc246",
    "msgid": "8f37305d-3a21-4494-86ce-04af5b7f2eb3",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": "OK",
  "result": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "id": "api.test.create",
  "ver": "1.0",
  "ts": "2023-11-02T10:33:23.321Z",
  "params": {
    "resmsgid": "3fc21690-796b-11ee-aa52-8d96a90bc246",
    "msgid": "8f37305d-3a21-4494-86ce-04af5b7f2eb3",
    "status": "failed",
    "err": "VALIDATION_ERROR",
    "errmsg": "Invalid input parameters"
  },
  "responseCode": "CLIENT_ERROR",
  "result": null
}
```

### Common Error Types
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `CONFLICT`: Resource state conflict
- `INTERNAL_ERROR`: Server error

### Error Handling

## Health

#### Health Check
- **Endpoint**: `GET /health`
- **Description**: Check service health and database connectivity
- **Headers**: None required
- **Response Structure**:
```json
{
  "status": "healthy",
  "timestamp": "2023-11-02T10:33:23.321Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```
- **Status Codes**: 200 (OK)

#### Validations and Conditions

**Input Validation Rules**:
- No input parameters required
- No request body validation needed
- No query parameters accepted

**Business Logic Conditions**:
- **Database Connectivity Check**: Validates PostgreSQL connection and executes a simple query
- **Redis Connectivity Check**: Validates Redis connection and performs a ping operation
- **Service Status Determination**: 
  - Returns "healthy" only if both database and Redis are accessible
  - Returns "unhealthy" if any service is down
  - Includes detailed error messages for failed services
- **Response Time**: Health check should complete within 5 seconds
- **Caching**: Health status is cached for 30 seconds to prevent excessive database load

**Authorization Conditions**:
- **Public Access**: No authentication required
- **No Multi-tenancy**: Health check operates at service level, not tenant level
- **No Rate Limiting**: Health endpoint is excluded from rate limiting
- **Monitoring Access**: Designed for load balancers and monitoring systems

**Error Scenarios**:
- **Database Down**: Returns 503 with database error details
- **Redis Down**: Returns 503 with Redis error details
- **Both Services Down**: Returns 503 with comprehensive error information
- **Timeout**: Returns 503 if health check exceeds 5 seconds

## Tests

#### Create Test
- **Endpoint**: `POST /tests`
- **Description**: Create a new test
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Request Body**:
```json
{
  "type": "plain",
  "title": "Sample Test",
  "description": "Test description",
  "timeDuration": 3600,
  "totalMarks": 100,
  "passingMarks": 50,
  "gradingType": "quiz",
  "attempts": 3
}
```

**Test Types**: `plain`, `rule_based`, `generated`  
**Test Status**: `draft`, `published`, `unpublished`, `archived`  
**Grading Types**: `quiz`, `assignment`, `feedback`  
**Attempts Grade Methods**: `first_attempt`, `last_attempt`, `average`, `highest`

- **Response Structure**:
```json
{
  "testId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 201 (Created), 400 (Bad Request)

#### Validations and Conditions

**Input Validation Rules**:
- **Required Fields**:
  - `type` (enum): Must be one of `plain`, `rule_based`, `generated`
  - `title` (string): 1-255 characters, non-empty after trimming
  - `gradingType` (enum): Must be one of `quiz`, `assignment`, `feedback`
- **Optional Fields**:
  - `parentId` (UUID): Valid UUID format if provided
  - `alias` (string): 1-100 characters, URL-friendly format
  - `description` (string): Non-empty string
  - `reviewers` (string): Non-empty string
  - `status` (enum): Must be one of `draft`, `published`, `unpublished`, `archived`
  - `timeDuration` (number): Positive integer
  - `timeFinishedDuration` (number): Positive integer
  - `totalMarks` (number): Positive integer
  - `passingMarks` (number): Positive integer, must be ≤ totalMarks
  - `image` (string): Valid URL format if provided
  - `startDate` (string): ISO 8601 date format, must be in future
  - `endDate` (string): ISO 8601 date format, must be after startDate
  - `attempts` (number): Positive integer
  - `attemptsGrading` (enum): Must be one of `first_attempt`, `last_attempt`, `average`, `highest`
- **Boolean Fields**: All boolean fields default to `false`
- **Date Validation**: Custom validator ensures endDate > startDate and startDate > current time

**Business Logic Conditions**:
- **Test Type Validation**:
  - `plain`: Requires title and totalMarks, no rules allowed
  - `rule_based`: Requires title and totalMarks, rules can be added later
  - `generated`: Cannot be created manually, generated during attempts
- **Marks Validation**: 
  - `passingMarks` must be ≤ `totalMarks`
  - Both marks must be positive integers
- **Date Constraints**:
  - `startDate` must be in the future
  - `endDate` must be after `startDate`
  - Custom validator enforces these constraints
- **Multi-tenancy**: All data automatically filtered by tenantId and organisationId
- **Audit Trail**: CreatedBy and CreatedAt automatically set from auth context

**Authorization Conditions**:
- **Required Headers**: All endpoints require `tenantId`, `organisationId`, `userId`
- **Header Validation**: UUID format validation for all required headers
- **Multi-tenant Isolation**: Data automatically isolated by tenant and organization
- **User Context**: All operations logged with userId for audit trail
- **No Role-based Access**: Currently no role restrictions (all authenticated users can create tests)

**Error Scenarios**:
- **Missing Headers**: 400 Bad Request with specific header name
- **Invalid UUID Format**: 400 Bad Request for malformed UUIDs
- **Validation Errors**: 400 Bad Request with field-specific error messages
- **Date Constraint Violation**: 400 Bad Request with custom error message
- **Database Errors**: 500 Internal Server Error with generic message
- **Duplicate Title**: 409 Conflict if title already exists in same tenant/organization

#### Get All Tests
- **Endpoint**: `GET /tests`
- **Description**: Get all tests with pagination and filters
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Query Parameters**:
  - `limit` (number, default: 10): Number of records per page
  - `offset` (number, default: 0): Number of records to skip
  - `search` (string, optional): Search in title/description
  - `status` (enum, optional): Filter by test status
  - `type` (string, optional): Filter by test type
  - `minMarks` (number, optional): Minimum marks filter
  - `maxMarks` (number, optional): Maximum marks filter
  - `sortBy` (string, optional): Sort field
  - `sortOrder` (enum, optional): `ASC` or `DESC`

- **Response Structure**:
```json
{
  "content": [
    {
      "testId": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Sample Test",
      "type": "plain",
      "status": "draft",
      "totalMarks": 100,
      "passingMarks": 50,
      "createdAt": "2023-11-02T10:33:23.321Z"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "currentPage": 1,
  "size": 10
}
```
- **Status Codes**: 200 (OK)

#### Get Test by ID
- **Endpoint**: `GET /tests/{id}`
- **Description**: Get a specific test by ID
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Test ID
- **Response Structure**: Complete test object with all fields
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Get Test Hierarchy
- **Endpoint**: `GET /tests/{id}/hierarchy`
- **Description**: Get test hierarchy with sections and questions
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Test ID
- **Response Structure**: Test with nested sections and questions
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Update Test
- **Endpoint**: `PATCH /tests/{id}`
- **Description**: Update an existing test
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Test ID
- **Request Body**: Partial test object (same fields as create)
- **Response Structure**:
```json
{
  "testId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Delete Test
- **Endpoint**: `DELETE /tests/{id}`
- **Description**: Delete a test (soft delete by default)
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Test ID
- **Query Parameters**:
  - `hard` (string, optional): Set to 'true' for hard delete
- **Response Structure**:
```json
{
  "message": "Test deleted successfully"
}
```
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Add Question to Test
- **Endpoint**: `POST /tests/{id}/questions`
- **Description**: Add a question to a test section
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Test ID
- **Request Body**:
```json
{
  "sectionId": "123e4567-e89b-12d3-a456-426614174000",
  "questionId": "123e4567-e89b-12d3-a456-426614174001",
  "isCompulsory": false
}
```
- **Response Structure**:
```json
{
  "message": "Question added to test successfully"
}
```
- **Status Codes**: 201 (Created), 400 (Bad Request), 404 (Not Found)

#### Add Questions Bulk
- **Endpoint**: `POST /tests/{id}/questions/bulk`
- **Description**: Add multiple questions to a test section
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Test ID
- **Request Body**:
```json
{
  "sectionId": "123e4567-e89b-12d3-a456-426614174000",
  "questions": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174001",
      "isCompulsory": false,
      "order": 1
    }
  ]
}
```
- **Response Structure**:
```json
{
  "message": "Questions added to test successfully",
  "result": {
    "added": 5,
    "skipped": 2,
    "errors": ["Questions not found: qstn-123, qstn-456"]
  }
}
```
- **Status Codes**: 201 (Created), 400 (Bad Request), 404 (Not Found)

#### Get User Test Status
- **Endpoint**: `GET /tests/{testId}/users/{userId}/status`
- **Description**: Check user test status and attempt limits
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `testId` (UUID): Test ID
  - `userId` (UUID): User ID
- **Response Structure**:
```json
{
  "canAttempt": true,
  "maxAttempts": 3,
  "attemptsMade": 1,
  "canResume": false,
  "lastAttemptId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Update Test Structure
- **Endpoint**: `PUT /tests/{testId}/structure`
- **Description**: Update complete test structure with sections and questions
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `testId` (UUID): Test ID
- **Request Body**:
```json
{
  "sections": [
    {
      "sectionId": "123e4567-e89b-12d3-a456-426614174000",
      "order": 1,
      "questions": [
        {
          "questionId": "123e4567-e89b-12d3-a456-426614174001",
          "order": 1,
          "isCompulsory": false
        }
      ]
    }
  ]
}
```
- **Response Structure**:
```json
{
  "message": "Test structure updated successfully"
}
```
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found)

## Questions

#### Create Question
- **Endpoint**: `POST /questions`
- **Description**: Create a new question
- **Headers**: `tenantId`, `organisationId`, `userId` (required)

**Question Types**: `mcq`, `multiple_answer`, `true_false`, `fill_blank`, `match`, `subjective`, `essay`  
**Question Levels**: `easy`, `medium`, `hard`  
**Question Status**: `draft`, `published`, `archived`

**Request Body Examples by Question Type:**

**1. MCQ (Multiple Choice Question)**
```json
{
  "text": "What is the capital of France?",
  "type": "mcq",
  "level": "medium",
  "marks": 5,
  "gradingType": "quiz",
  "media": {
    "image": "https://cdn.example.com/france-flag.png"
  },
  "options": [
    {
      "text": "London",
      "isCorrect": false,
      "position": 1
    },
    {
      "text": "Paris",
      "isCorrect": true,
      "position": 2
    },
    {
      "text": "Berlin",
      "isCorrect": false,
      "position": 3
    },
    {
      "text": "Madrid",
      "isCorrect": false,
      "position": 4
    }
  ]
}
```

**2. Multiple Answer Question**
```json
{
  "text": "Which of the following are programming languages?",
  "type": "multiple_answer",
  "level": "medium",
  "marks": 10,
  "gradingType": "quiz",
  "allowPartialScoring": true,
  "options": [
    {
      "text": "Python",
      "isCorrect": true,
      "marks": 2.5,
      "position": 1
    },
    {
      "text": "Java",
      "isCorrect": true,
      "marks": 2.5,
      "position": 2
    },
    {
      "text": "HTML",
      "isCorrect": false,
      "position": 3
    },
    {
      "text": "JavaScript",
      "isCorrect": true,
      "marks": 2.5,
      "position": 4
    },
    {
      "text": "CSS",
      "isCorrect": false,
      "position": 5
    }
  ]
}
```

**3. True/False Question**
```json
{
  "text": "The Earth is the third planet from the Sun.",
  "type": "true_false",
  "level": "easy",
  "marks": 2,
  "gradingType": "quiz",
  "options": [
    {
      "text": "True",
      "isCorrect": true,
      "position": 1
    },
    {
      "text": "False",
      "isCorrect": false,
      "position": 2
    }
  ]
}
```

**4. Fill in the Blank Question**
```json
{
  "text": "The capital of India is _____ and the largest city is _____.",
  "type": "fill_blank",
  "level": "easy",
  "marks": 6,
  "gradingType": "quiz",
  "allowPartialScoring": true,
  "options": [
    {
      "text": "New Delhi",
      "isCorrect": true,
      "blankIndex": 0,
      "marks": 3,
      "position": 1
    },
    {
      "text": "Delhi",
      "isCorrect": true,
      "blankIndex": 0,
      "marks": 3,
      "position": 2
    },
    {
      "text": "Mumbai",
      "isCorrect": true,
      "blankIndex": 1,
      "marks": 3,
      "position": 3
    },
    {
      "text": "Bombay",
      "isCorrect": true,
      "blankIndex": 1,
      "marks": 3,
      "position": 4
    }
  ]
}
```

**Note**: For fill-in-the-blank questions:
- Each blank has a `blankIndex` starting from 0
- Multiple correct answers can be provided for each blank
- `blanks` array in answer submission contains user's text input for each blank
- Case sensitivity can be controlled per option
- Partial scoring is supported with individual marks per correct answer

**5. Match Question**
```json
{
  "text": "Match the countries with their capitals:",
  "type": "match",
  "level": "medium",
  "marks": 8,
  "gradingType": "quiz",
  "options": [
    {
      "text": "France",
      "matchWith": "Paris",
      "position": 1
    },
    {
      "text": "Germany",
      "matchWith": "Berlin",
      "position": 2
    },
    {
      "text": "Spain",
      "matchWith": "Madrid",
      "position": 3
    },
    {
      "text": "Italy",
      "matchWith": "Rome",
      "position": 4
    }
  ]
}
```

**6. Subjective Question (Short Answer)**
```json
{
  "text": "Explain the difference between HTTP and HTTPS in 2-3 sentences.",
  "type": "subjective",
  "level": "medium",
  "marks": 10,
  "gradingType": "assignment",
  "params": {
    "maxLength": 500,
    "minLength": 50,
    "wordLimit": 100,
    "allowAttachments": true,
    "rubric": {
      "criteria": [
        {
          "name": "Technical Accuracy",
          "maxScore": 5,
          "description": "Correct technical explanation"
        },
        {
          "name": "Clarity",
          "maxScore": 3,
          "description": "Clear and understandable explanation"
        },
        {
          "name": "Completeness",
          "maxScore": 2,
          "description": "Covers all important points"
        }
      ]
    }
  }
}
```

**7. Essay Question (Long Answer)**
```json
{
  "text": "Discuss the impact of artificial intelligence on modern education. Include examples and potential challenges.",
  "type": "essay",
  "level": "hard",
  "marks": 25,
  "gradingType": "assignment",
  "idealTime": 1800,
  "params": {
    "maxLength": 2000,
    "minLength": 300,
    "wordLimit": 800,
    "allowAttachments": true,
    "rubric": {
      "criteria": [
        {
          "name": "Content Quality",
          "maxScore": 10,
          "description": "Depth and relevance of content"
        },
        {
          "name": "Structure",
          "maxScore": 5,
          "description": "Logical organization and flow"
        },
        {
          "name": "Examples",
          "maxScore": 5,
          "description": "Quality and relevance of examples"
        },
        {
          "name": "Analysis",
          "maxScore": 5,
          "description": "Critical thinking and analysis"
        }
      ]
    }
  }
}
```

- **Response Structure**:
```json
{
  "questionId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 201 (Created), 400 (Bad Request)

#### Validations and Conditions

**Input Validation Rules**:
- **Required Fields**:
  - `text` (string): Non-empty after trimming, 1-5000 characters
  - `type` (enum): Must be one of `mcq`, `multiple_answer`, `true_false`, `fill_blank`, `match`, `subjective`, `essay`
- **Optional Fields**:
  - `media` (object): Valid URLs for image, video, audio, document
  - `alias` (string): 1-100 characters, URL-friendly format
  - `description` (string): Non-empty string
  - `categoryId` (UUID): Valid UUID format if provided
  - `level` (enum): Must be one of `easy`, `medium`, `hard` (defaults to `medium`)
  - `marks` (number): Positive integer (defaults to 1)
  - `status` (enum): Must be one of `draft`, `published`, `archived` (defaults to `draft`)
  - `idealTime` (number): Positive integer
  - `gradingType` (enum): Must be one of `quiz`, `assignment`, `feedback` (defaults to `quiz`)
  - `allowPartialScoring` (boolean): Defaults to `false`
  - `params` (object): Question-specific parameters
  - `options` (array): Array of question options (required for non-subjective questions)

**Question Type-Specific Validation**:
- **MCQ/TRUE_FALSE**: 
  - Exactly one correct option required
  - Minimum 2 options, maximum 10 options
  - All options must have non-empty text
- **MULTIPLE_ANSWER**:
  - At least one correct option required
  - If `allowPartialScoring` is true, all correct options must have marks
  - Sum of option marks must equal question marks
- **FILL_BLANK**:
  - Options must have `blankIndex` starting from 0
  - Sequential blank indices with no gaps
  - Each blank must have at least one correct answer
  - If `allowPartialScoring` is true, all correct options must have marks
- **MATCH**:
  - All options must have `matchWith` text
  - All options with `matchWith` must be marked correct
  - No duplicate `matchWith` values
- **SUBJECTIVE/ESSAY**:
  - No options required
  - `params` validation: `maxLength > minLength`, `wordLimit > 0`
  - Rubric criteria must have positive `maxScore`

**Business Logic Conditions**:
- **Options Validation**:
  - Non-subjective questions require at least one option
  - Option text must be unique (case-insensitive)
  - Option marks cannot exceed question marks
  - All options must have valid boolean `isCorrect` value
- **Partial Scoring**:
  - Only available for `multiple_answer` and `fill_blank` types
  - Requires all correct options to have marks
  - Total option marks must equal question marks
- **Media Validation**:
  - All media URLs must be valid HTTP/HTTPS URLs
  - Maximum 4 media items per question/option
- **Parameter Validation**:
  - `maxLength` must be greater than `minLength`
  - `wordLimit` must be positive
  - Rubric criteria must have unique names and positive scores
- **Multi-tenancy**: All data automatically filtered by tenantId and organisationId
- **Audit Trail**: CreatedBy and CreatedAt automatically set from auth context

**Authorization Conditions**:
- **Required Headers**: All endpoints require `tenantId`, `organisationId`, `userId`
- **Header Validation**: UUID format validation for all required headers
- **Multi-tenant Isolation**: Data automatically isolated by tenant and organization
- **User Context**: All operations logged with userId for audit trail
- **No Role-based Access**: Currently no role restrictions (all authenticated users can create questions)

**Error Scenarios**:
- **Missing Headers**: 400 Bad Request with specific header name
- **Invalid UUID Format**: 400 Bad Request for malformed UUIDs
- **Validation Errors**: 400 Bad Request with field-specific error messages
- **Question Type Errors**: 400 Bad Request for invalid option configurations
- **Duplicate Options**: 400 Bad Request for duplicate option texts
- **Partial Scoring Errors**: 400 Bad Request for invalid partial scoring configuration
- **Database Errors**: 500 Internal Server Error with generic message
- **Media URL Errors**: 400 Bad Request for invalid media URLs

#### Get All Questions
- **Endpoint**: `GET /questions`
- **Description**: Get all questions with pagination and filters
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Query Parameters**:
  - `limit` (number, default: 10): Number of records per page
  - `offset` (number, default: 0): Number of records to skip
  - `search` (string, optional): Search in question text
  - `type` (enum, optional): Filter by question type
  - `level` (enum, optional): Filter by difficulty level
  - `status` (enum, optional): Filter by question status
  - `categoryId` (UUID, optional): Filter by category
  - `sortBy` (string, optional): Sort field
  - `sortOrder` (enum, optional): `ASC` or `DESC`

- **Response Structure**: Paginated list of questions
- **Status Codes**: 200 (OK)

#### Get Question by ID
- **Endpoint**: `GET /questions/{id}`
- **Description**: Get a specific question by ID
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Question ID
- **Response Structure**: Complete question object with options
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Update Question
- **Endpoint**: `PATCH /questions/{id}`
- **Description**: Update an existing question
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Question ID
- **Request Body**: Partial question object (same fields as create)
- **Response Structure**:
```json
{
  "questionId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Delete Question
- **Endpoint**: `DELETE /questions/{id}`
- **Description**: Delete a question
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Question ID
- **Response Structure**:
```json
{
  "message": "Question deleted successfully"
}
```
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Rule Preview
- **Endpoint**: `POST /questions/rule-preview`
- **Description**: Preview questions based on rule criteria
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Request Body**:
```json
{
  "criteria": {
    "categories": ["math", "science"],
    "difficultyLevels": ["medium", "hard"],
    "questionTypes": ["mcq", "subjective"],
    "marks": [5, 10]
  },
  "numberOfQuestions": 10
}
```
- **Response Structure**: Questions matching criteria with metadata
- **Status Codes**: 200 (OK), 400 (Bad Request)

## Attempts

#### Start Attempt
- **Endpoint**: `POST /attempts/start/{testId}`
- **Description**: Start a new test attempt
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `testId` (UUID): Test ID
- **Response Structure**:
```json
{
  "attemptId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 201 (Created), 400 (Bad Request), 404 (Not Found)

#### Validations and Conditions

**Input Validation Rules**:
- **Required Path Parameters**:
  - `testId` (UUID): Valid UUID format, must exist in database
- **Required Headers**:
  - `tenantId` (UUID): Valid UUID format
  - `organisationId` (UUID): Valid UUID format
  - `userId` (UUID): Valid UUID format
- **No Request Body**: Endpoint does not accept request body

**Business Logic Conditions**:
- **Test Existence**: Test must exist and belong to the specified tenant/organization
- **Test Status**: Test must be in `published` status
- **Test Availability**:
  - Current time must be within test's `startDate` and `endDate` range
  - If `startDate` is set, current time must be after it
  - If `endDate` is set, current time must be before it
- **Attempt Limits**:
  - User must not have exceeded maximum attempts for this test
  - Maximum attempts is defined by test's `attempts` field (default: 1)
- **Existing Attempts**:
  - User must not have an incomplete attempt in progress
  - User must not have a submitted attempt pending review
- **Test Type Handling**:
  - For `plain` tests: Uses existing test structure
  - For `rule_based` tests: Dynamically generates test based on rules
  - For `generated` tests: Creates new test instance for this attempt
- **Multi-tenancy**: All data automatically filtered by tenantId and organisationId
- **Audit Trail**: Attempt creation logged with userId and timestamp

**Authorization Conditions**:
- **Required Headers**: All endpoints require `tenantId`, `organisationId`, `userId`
- **Header Validation**: UUID format validation for all required headers
- **Multi-tenant Isolation**: Data automatically isolated by tenant and organization
- **User Context**: All operations logged with userId for audit trail
- **No Role-based Access**: Currently no role restrictions (all authenticated users can start attempts)

**Error Scenarios**:
- **Missing Headers**: 400 Bad Request with specific header name
- **Invalid UUID Format**: 400 Bad Request for malformed UUIDs
- **Test Not Found**: 404 Not Found if test doesn't exist
- **Test Not Published**: 400 Bad Request if test status is not `published`
- **Test Not Available**: 400 Bad Request if current time outside test availability window
- **Max Attempts Reached**: 400 Bad Request if user has exceeded attempt limit
- **Incomplete Attempt**: 400 Bad Request if user has an incomplete attempt
- **Pending Review**: 400 Bad Request if user has a submitted attempt pending review
- **Database Errors**: 500 Internal Server Error with generic message
- **Rule Generation Errors**: 500 Internal Server Error if rule-based test generation fails

#### Resume Attempt
- **Endpoint**: `GET /attempts/{attemptId}/resume/{userId}`
- **Description**: Resume an in-progress attempt
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `attemptId` (UUID): Attempt ID
  - `userId` (UUID): User ID
- **Response Structure**: Attempt data with previous answers and state
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found)

#### Get Attempt Questions
- **Endpoint**: `GET /attempts/{attemptId}/questions/{userId}`
- **Description**: Get questions for an attempt
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `attemptId` (UUID): Attempt ID
  - `userId` (UUID): User ID
- **Response Structure**: Questions with options and user answers
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Submit Answers
- **Endpoint**: `POST /attempts/{attemptId}/answers`
- **Description**: Submit multiple answers for questions
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `attemptId` (UUID): Attempt ID

**Request Body Examples by Question Type:**

**1. MCQ (Multiple Choice Question)**
```json
{
  "answers": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174000",
      "answer": {
        "selectedOptionIds": ["opt-2"]
      }
    }
  ],
  "timeSpent": 45
}
```

**2. Multiple Answer Question**
```json
{
  "answers": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174001",
      "answer": {
        "selectedOptionIds": ["opt-1", "opt-2", "opt-4"]
      }
    }
  ],
  "timeSpent": 120
}
```

**3. True/False Question**
```json
{
  "answers": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174002",
      "answer": {
        "selectedOptionIds": ["opt-1"]
      }
    }
  ],
  "timeSpent": 15
}
```

**4. Fill in the Blank Question**
```json
{
  "answers": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174003",
      "answer": {
        "blanks": ["New Delhi", "Mumbai"]
      }
    }
  ],
  "timeSpent": 30
}
```

**5. Match Question**
```json
{
  "answers": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174004",
      "answer": {
        "matches": [
          {
            "optionId": "opt-1",
            "matchWith": "Paris"
          },
          {
            "optionId": "opt-2",
            "matchWith": "Berlin"
          },
          {
            "optionId": "opt-3",
            "matchWith": "Madrid"
          },
          {
            "optionId": "opt-4",
            "matchWith": "Rome"
          }
        ]
      }
    }
  ],
  "timeSpent": 90
}
```

**6. Subjective Question (Short Answer)**
```json
{
  "answers": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174005",
      "answer": {
        "text": "HTTP is a protocol for transmitting data over the web without encryption, while HTTPS uses SSL/TLS encryption to secure the data transmission. HTTPS provides authentication and data integrity, making it essential for sensitive information like passwords and credit card details."
      }
    }
  ],
  "timeSpent": 300
}
```

**7. Essay Question (Long Answer)**
```json
{
  "answers": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174006",
      "answer": {
        "text": "Artificial Intelligence has significantly transformed modern education by introducing personalized learning experiences, automated grading systems, and intelligent tutoring systems. AI-powered platforms can adapt to individual student needs, providing customized content and pacing. However, challenges include concerns about data privacy, potential job displacement for educators, and the digital divide that may exclude students without access to technology. Additionally, there are ethical considerations regarding algorithmic bias and the need to maintain human oversight in educational decision-making processes."
      }
    }
  ],
  "timeSpent": 1800
}
```

**8. Mixed Question Types in Single Request**
```json
{
  "answers": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174000",
      "answer": {
        "selectedOptionIds": ["opt-2"]
      }
    },
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174001",
      "answer": {
        "selectedOptionIds": ["opt-1", "opt-3"]
      }
    },
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174002",
      "answer": {
        "blanks": ["New Delhi", "Mumbai"]
      }
    },
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174003",
      "answer": {
        "text": "The main difference between HTTP and HTTPS is security. HTTPS encrypts data transmission while HTTP does not."
      }
    }
  ],
  "timeSpent": 600
}
```

- **Response Structure**:
```json
{
  "message": "Answers submitted successfully"
}
```
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found)

#### Validations and Conditions

**Input Validation Rules**:
- **Required Path Parameters**:
  - `attemptId` (UUID): Valid UUID format, must exist and belong to user
- **Required Headers**:
  - `tenantId` (UUID): Valid UUID format
  - `organisationId` (UUID): Valid UUID format
  - `userId` (UUID): Valid UUID format
- **Required Request Body Fields**:
  - `answers` (array): Non-empty array of answer objects
  - Each answer must have `questionId` (UUID) and `answer` object
- **Optional Request Body Fields**:
  - `timeSpent` (number): Positive integer

**Answer Type-Specific Validation**:
- **MCQ/TRUE_FALSE**:
  - `selectedOptionIds` (array): Array of valid option UUIDs
  - Must contain exactly one option for MCQ/TRUE_FALSE
  - All option IDs must exist and belong to the question
- **MULTIPLE_ANSWER**:
  - `selectedOptionIds` (array): Array of valid option UUIDs
  - Can contain multiple options
  - All option IDs must exist and belong to the question
- **FILL_BLANK**:
  - `blanks` (array): Array of strings for each blank
  - Array length must match number of blanks in question
  - Each blank must be non-empty string
- **MATCH**:
  - `matches` (array): Array of match objects
  - Each match must have `optionId` (UUID) and `matchWith` (string)
  - All option IDs must exist and belong to the question
  - No duplicate option IDs allowed
- **SUBJECTIVE/ESSAY**:
  - `text` (string): Non-empty string
  - Length must be within question's `params.maxLength` and `params.minLength`
  - Word count must be within `params.wordLimit` if specified

**Business Logic Conditions**:
- **Attempt Validation**:
  - Attempt must exist and belong to the specified user
  - Attempt status must be `I - in_progress`
  - Attempt must not be expired or submitted
- **Question Validation**:
  - All question IDs must exist and belong to the test
  - Questions must be part of the specified attempt
  - Questions must not be already answered in this submission
- **Answer Format Validation**:
  - Answer format must match question type
  - For MCQ/TRUE_FALSE: Exactly one option selected
  - For MULTIPLE_ANSWER: At least one option selected
  - For FILL_BLANK: Correct number of blanks provided
  - For MATCH: All options matched exactly once
  - For SUBJECTIVE/ESSAY: Text within length limits
- **Time Tracking**:
  - `timeSpent` is optional but recommended for analytics
  - Time is cumulative across all submissions
- **Multi-tenancy**: All data automatically filtered by tenantId and organisationId
- **Audit Trail**: Answer submission logged with userId and timestamp

**Authorization Conditions**:
- **Required Headers**: All endpoints require `tenantId`, `organisationId`, `userId`
- **Header Validation**: UUID format validation for all required headers
- **Multi-tenant Isolation**: Data automatically isolated by tenant and organization
- **User Context**: All operations logged with userId for audit trail
- **Attempt Ownership**: User can only submit answers to their own attempts
- **No Role-based Access**: Currently no role restrictions (all authenticated users can submit answers)

**Error Scenarios**:
- **Missing Headers**: 400 Bad Request with specific header name
- **Invalid UUID Format**: 400 Bad Request for malformed UUIDs
- **Attempt Not Found**: 404 Not Found if attempt doesn't exist
- **Attempt Not Owned**: 403 Forbidden if attempt doesn't belong to user
- **Attempt Not In Progress**: 400 Bad Request if attempt is not in progress
- **Question Not Found**: 400 Bad Request if question doesn't exist
- **Invalid Answer Format**: 400 Bad Request if answer format doesn't match question type
- **Option Not Found**: 400 Bad Request if selected option doesn't exist
- **Duplicate Answers**: 400 Bad Request if same question answered multiple times
- **Text Length Violation**: 400 Bad Request if text exceeds limits
- **Database Errors**: 500 Internal Server Error with generic message

#### Submit Attempt
- **Endpoint**: `POST /attempts/{attemptId}/submit`
- **Description**: Submit a test attempt
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `attemptId` (UUID): Attempt ID
- **Response Structure**:
```json
{
  "attemptId": "123e4567-e89b-12d3-a456-426614174000",
  "score": 85,
  "reviewStatus": "pending",
  "result": "pass",
  "totalMarks": 100
}
```
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found)

#### Review Attempt
- **Endpoint**: `POST /attempts/{attemptId}/review`
- **Description**: Review subjective questions in an attempt
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `attemptId` (UUID): Attempt ID
- **Request Body**:
```json
{
  "reviews": [
    {
      "questionId": "123e4567-e89b-12d3-a456-426614174000",
      "score": 8,
      "feedback": "Good answer"
    }
  ]
}
```
- **Response Structure**: Updated attempt with final score
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found)

#### Get Pending Reviews
- **Endpoint**: `GET /attempts/reviews/pending`
- **Description**: Get pending reviews for subjective questions
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Response Structure**: List of attempts with pending reviews
- **Status Codes**: 200 (OK)

## Sections

#### Create Section
- **Endpoint**: `POST /sections`
- **Description**: Create a new test section
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Request Body**:
```json
{
  "testId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Section 1",
  "description": "First section",
  "order": 1
}
```
- **Response Structure**:
```json
{
  "sectionId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 201 (Created), 400 (Bad Request)

#### Validations and Conditions

**Input Validation Rules**:
- **Required Fields**:
  - `testId` (UUID): Valid UUID format, must exist in database
  - `name` (string): 1-255 characters, non-empty after trimming
- **Optional Fields**:
  - `description` (string): Non-empty string
  - `order` (number): Positive integer (defaults to 0)

**Business Logic Conditions**:
- **Test Validation**:
  - Test must exist and belong to the specified tenant/organization
  - Test status must not be `published` (can't modify published tests)
  - Test type validation:
    - `plain`: Can have sections with questions
    - `rule_based`: Can have sections with rules and questions
    - `generated`: Cannot have manual sections (created automatically)
- **Section Name Validation**:
  - Section name must be unique within the test
  - Case-insensitive uniqueness check
- **Order Validation**:
  - Order must be positive integer
  - Duplicate orders allowed (handled by UI)
- **Multi-tenancy**: All data automatically filtered by tenantId and organisationId
- **Audit Trail**: CreatedBy and CreatedAt automatically set from auth context

**Authorization Conditions**:
- **Required Headers**: All endpoints require `tenantId`, `organisationId`, `userId`
- **Header Validation**: UUID format validation for all required headers
- **Multi-tenant Isolation**: Data automatically isolated by tenant and organization
- **User Context**: All operations logged with userId for audit trail
- **Test Ownership**: User can only create sections for tests they have access to
- **No Role-based Access**: Currently no role restrictions (all authenticated users can create sections)

**Error Scenarios**:
- **Missing Headers**: 400 Bad Request with specific header name
- **Invalid UUID Format**: 400 Bad Request for malformed UUIDs
- **Test Not Found**: 404 Not Found if test doesn't exist
- **Test Published**: 400 Bad Request if test is already published
- **Invalid Test Type**: 400 Bad Request if test type doesn't support sections
- **Duplicate Section Name**: 409 Conflict if section name already exists
- **Database Errors**: 500 Internal Server Error with generic message

#### Get All Sections
- **Endpoint**: `GET /sections`
- **Description**: List all sections
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Response Structure**: List of all sections
- **Status Codes**: 200 (OK)

#### Get Sections by Test
- **Endpoint**: `GET /sections/test/{testId}`
- **Description**: List all sections for a specific test
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `testId` (UUID): Test ID
- **Response Structure**: List of sections for the test
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Get Section by ID
- **Endpoint**: `GET /sections/{id}`
- **Description**: Get a section by ID
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Section ID
- **Response Structure**: Complete section object
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Update Section
- **Endpoint**: `PATCH /sections/{id}`
- **Description**: Update a section
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Section ID
- **Request Body**: Partial section object
- **Response Structure**:
```json
{
  "sectionId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Delete Section
- **Endpoint**: `DELETE /sections/{id}`
- **Description**: Delete a section
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Section ID
- **Query Parameters**:
  - `hard` (string, optional): Set to 'true' for hard delete
- **Response Structure**:
```json
{
  "message": "Section deleted successfully"
}
```
- **Status Codes**: 200 (OK), 404 (Not Found)

## Rules

#### Create Rule
- **Endpoint**: `POST /rules`
- **Description**: Create a new test rule
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Request Body**:
```json
{
  "name": "Math Questions Rule",
  "description": "Rule for selecting math questions",
  "ruleType": "category_based",
  "testId": "123e4567-e89b-12d3-a456-426614174000",
  "numberOfQuestions": 10,
  "poolSize": 50,
  "selectionStrategy": "random",
  "criteria": {
    "categories": ["math"],
    "difficultyLevels": ["medium", "hard"],
    "questionTypes": ["mcq", "subjective"]
  }
}
```

**Rule Types**: `category_based`, `difficulty_based`, `type_based`, `mixed`  
**Selection Strategies**: `random`, `sequential`, `weighted`  
**Selection Modes**: `PRESELECTED`, `DYNAMIC`

- **Response Structure**:
```json
{
  "ruleId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 201 (Created), 400 (Bad Request)

#### Validations and Conditions

**Input Validation Rules**:
- **Required Fields**:
  - `name` (string): 1-255 characters, non-empty after trimming
  - `ruleType` (enum): Must be one of `category_based`, `difficulty_based`, `type_based`, `mixed`
  - `testId` (UUID): Valid UUID format, must exist in database
  - `numberOfQuestions` (number): Positive integer
  - `poolSize` (number): Positive integer, must be ≥ numberOfQuestions
  - `selectionStrategy` (enum): Must be one of `random`, `sequential`, `weighted`
  - `criteria` (object): Rule selection criteria
- **Optional Fields**:
  - `description` (string): Non-empty string
  - `sectionId` (UUID): Valid UUID format if provided
  - `minMarks` (number): Positive integer
  - `maxMarks` (number): Positive integer, must be ≥ minMarks
  - `selectionMode` (enum): Must be one of `PRESELECTED`, `DYNAMIC` (defaults to `DYNAMIC`)
  - `isActive` (boolean): Defaults to `true`
  - `priority` (number): Integer (defaults to 0)

**Criteria Validation**:
- **categories** (array): Array of strings
- **difficultyLevels** (array): Array of enums, must be `easy`, `medium`, `hard`
- **questionTypes** (array): Array of enums, must be valid question types
- **tags** (array): Array of strings
- **marks** (array): Array of numbers
- **excludeQuestionIds** (array): Array of UUIDs, questions to exclude
- **includeQuestionIds** (array): Array of UUIDs, questions to include
- **timeRange** (object): Date range with `from` and `to` ISO dates

**Business Logic Conditions**:
- **Test Validation**:
  - Test must exist and belong to the specified tenant/organization
  - Test status must not be `published` (can't modify published tests)
  - Test type must be `rule_based` (plain tests don't support rules)
- **Rule Type Validation**:
  - `category_based`: Requires categories in criteria
  - `difficulty_based`: Requires difficultyLevels in criteria
  - `type_based`: Requires questionTypes in criteria
  - `mixed`: Requires multiple criteria types
- **Question Pool Validation**:
  - `poolSize` must be ≥ `numberOfQuestions`
  - System validates that enough questions exist matching criteria
  - If insufficient questions, rule creation fails
- **Section Validation**:
  - If `sectionId` provided, section must exist and belong to the test
  - Section must not be archived
- **Marks Validation**:
  - If both `minMarks` and `maxMarks` provided, `maxMarks` must be ≥ `minMarks`
  - Marks must be positive integers
- **Selection Strategy Validation**:
  - `random`: No additional validation
  - `sequential`: Requires ordered question pool
  - `weighted`: Requires question weight data
- **Multi-tenancy**: All data automatically filtered by tenantId and organisationId
- **Audit Trail**: CreatedBy and CreatedAt automatically set from auth context

**Authorization Conditions**:
- **Required Headers**: All endpoints require `tenantId`, `organisationId`, `userId`
- **Header Validation**: UUID format validation for all required headers
- **Multi-tenant Isolation**: Data automatically isolated by tenant and organization
- **User Context**: All operations logged with userId for audit trail
- **Test Ownership**: User can only create rules for tests they have access to
- **No Role-based Access**: Currently no role restrictions (all authenticated users can create rules)

**Error Scenarios**:
- **Missing Headers**: 400 Bad Request with specific header name
- **Invalid UUID Format**: 400 Bad Request for malformed UUIDs
- **Test Not Found**: 404 Not Found if test doesn't exist
- **Test Not Rule-based**: 400 Bad Request if test type is not `rule_based`
- **Test Published**: 400 Bad Request if test is already published
- **Invalid Rule Type**: 400 Bad Request for unsupported rule type
- **Insufficient Questions**: 400 Bad Request if not enough questions match criteria
- **Invalid Criteria**: 400 Bad Request for invalid criteria combinations
- **Section Not Found**: 400 Bad Request if sectionId provided but not found
- **Marks Range Error**: 400 Bad Request if maxMarks < minMarks
- **Pool Size Error**: 400 Bad Request if poolSize < numberOfQuestions
- **Database Errors**: 500 Internal Server Error with generic message

#### Get All Rules
- **Endpoint**: `GET /rules`
- **Description**: List all rules with optional filters
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Query Parameters**:
  - `testId` (UUID, optional): Filter by test ID
  - `sectionId` (UUID, optional): Filter by section ID
- **Response Structure**: List of rules
- **Status Codes**: 200 (OK)

#### Get Rule by ID
- **Endpoint**: `GET /rules/{id}`
- **Description**: Get a rule by ID
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Rule ID
- **Response Structure**: Complete rule object
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Update Rule
- **Endpoint**: `PATCH /rules/{id}`
- **Description**: Update a rule
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Rule ID
- **Request Body**: Partial rule object
- **Response Structure**:
```json
{
  "ruleId": "123e4567-e89b-12d3-a456-426614174000"
}
```
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Delete Rule
- **Endpoint**: `DELETE /rules/{id}`
- **Description**: Delete a rule
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `id` (UUID): Rule ID
- **Response Structure**:
```json
{
  "message": "Rule deleted successfully"
}
```
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Get Rules for Test
- **Endpoint**: `GET /rules/test/{testId}`
- **Description**: Get all rules for a specific test
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `testId` (UUID): Test ID
- **Response Structure**: List of rules for the test
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Get Rules for Section
- **Endpoint**: `GET /rules/section/{sectionId}`
- **Description**: Get all rules for a specific section
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `sectionId` (UUID): Section ID
- **Response Structure**: List of rules for the section
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Get Rule Preview
- **Endpoint**: `GET /rules/{ruleId}/preview`
- **Description**: Get rule preview with metadata
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `ruleId` (UUID): Rule ID
- **Response Structure**: Rule preview with question count and metadata
- **Status Codes**: 200 (OK), 404 (Not Found)

#### Get Questions by Rule Criteria
- **Endpoint**: `POST /rules/{ruleId}/questions`
- **Description**: Get questions based on rule criteria for pre-selection
- **Headers**: `tenantId`, `organisationId`, `userId` (required)
- **Path Parameters**:
  - `ruleId` (UUID): Rule ID
- **Response Structure**: Questions matching rule criteria
- **Status Codes**: 200 (OK), 404 (Not Found)

## Error Handling

### Common HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data or missing headers
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource state conflict
- **500 Internal Server Error**: Server error

### Validation Errors
When validation fails, the response includes field-specific errors:
```json
{
  "id": "api.test.create",
  "ver": "1.0",
  "ts": "2023-11-02T10:33:23.321Z",
  "params": {
    "status": "failed",
    "err": "VALIDATION_ERROR",
    "errmsg": "Validation failed"
  },
  "responseCode": "CLIENT_ERROR",
  "result": null
}
```

## Rate Limiting

The API implements rate limiting with the following configuration:
- **Limit**: 100 requests per minute per IP
- **TTL**: 60 seconds
- **Headers**: Rate limit information included in response headers

## Pagination

All list endpoints support pagination with the following parameters:
- **limit** (number, default: 10): Number of records per page
- **offset** (number, default: 0): Number of records to skip

Response includes pagination metadata:
```json
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 10,
  "currentPage": 1,
  "size": 10
}
```

## Multi-tenancy

All endpoints require multi-tenancy headers:
- `tenantId`: UUID for tenant isolation
- `organisationId`: UUID for organization isolation
- `userId`: UUID for audit trail

Data is automatically filtered by tenant and organization IDs.
