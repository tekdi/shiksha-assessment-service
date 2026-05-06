---
sidebar_position: 7
---

# API Docs

The Assessment service exposes a RESTful API for managing tests and assessments. All endpoints require `tenantId` and `organisationId` headers for data isolation.

## 1. Storage

**1. Generate Presigned URL**

- **Method**: `POST`
- **URL**: `/assessment/v1/storage/presigned-url`
- **Description**: Generate a presigned URL for file upload.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/storage/presigned-url",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "fileName": "question-image.png",
    "fileType": "image/png",
    "folder": "questions"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.storage.presigned-url",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": {
    "resmsgid": "msg-877706-1754892379896",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "presignedUrl": "https://storage.example.com/uploads/question-image.png?X-Amz-Signature=abc123",
    "fileUrl": "https://storage.example.com/uploads/question-image.png",
    "expiresIn": 3600
  }
}
```

## 2. Configuration

**1. Get LMS Configuration**

- **Method**: `GET`
- **URL**: `/assessment/v1/config`
- **Description**: Get LMS configuration for the assessment service.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/config",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.config.read",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "config": {
      "maxAttempts": 3,
      "passingPercentage": 50,
      "shuffleQuestions": true,
      "showResults": true
    }
  }
}
```

**2. Sync Configuration**

- **Method**: `POST`
- **URL**: `/assessment/v1/config/sync`
- **Description**: Sync configuration from external service.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/config/sync",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {}
}
```

- **Response:**

```json
{
  "id": "api.assessment.config.sync",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "synced": true, "message": "Configuration synced successfully" }
}
```

## 3. Health

**1. Health Check (Readiness)**

- **Method**: `GET`
- **URL**: `/health`
- **Description**: Check service health and database connection (readiness probe).
- **Request Headers:** None required.

- **Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-08-11T06:06:19.896Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

**2. Liveness Probe**

- **Method**: `GET`
- **URL**: `/health/live`
- **Description**: Liveness probe — checks if service is running (no DB check).

- **Response:**

```json
{ "status": "ok" }
```

**3. Readiness Probe**

- **Method**: `GET`
- **URL**: `/health/ready`
- **Description**: Readiness probe — checks if service and database are ready.

- **Response:**

```json
{ "status": "ready", "database": "connected" }
```

## 4. Tests

**1. Create Test**

- **Method**: `POST`
- **URL**: `/assessment/v1/tests`
- **Description**: Create a new test.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/tests",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "userId": "<USER_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "type": "plain",
    "title": "Math Fundamentals Test",
    "description": "A test covering basic math concepts",
    "timeDuration": 3600,
    "totalMarks": 100,
    "passingMarks": 50,
    "gradingType": "quiz",
    "attempts": 3,
    "allowResubmission": false,
    "status": "draft"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.create",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 201,
  "result": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "tenantId": "ef99949b-7f3a-4a5f-806a-e67e683e38f3",
    "organisationId": "d36d9079-0f42-4ba3-be03-26c9e79509ee",
    "title": "Math Fundamentals Test",
    "type": "plain",
    "status": "draft",
    "totalMarks": 100,
    "passingMarks": 50,
    "timeDuration": 3600,
    "attempts": 3,
    "createdAt": "2025-08-11T06:06:19.896Z",
    "createdBy": "35113bfc-adce-47fc-b85d-871cbcb00bcc"
  }
}
```

**2. Get All Tests**

- **Method**: `GET`
- **URL**: `/assessment/v1/tests`
- **Description**: Get all tests with pagination and filters.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/tests",
  "queryParams": {
    "limit": 10,
    "offset": 0,
    "status": "published",
    "type": "plain",
    "sortBy": "createdAt",
    "sortOrder": "DESC"
  },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.list",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "content": [
      {
        "testId": "d3e4f567-e89b-12d3-a456-426614174000",
        "title": "Math Fundamentals Test",
        "type": "plain",
        "status": "published",
        "totalMarks": 100,
        "passingMarks": 50,
        "createdAt": "2025-08-11T06:06:19.896Z"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "currentPage": 1,
    "size": 10
  }
}
```

**3. Search Tests**

- **Method**: `POST`
- **URL**: `/assessment/v1/tests/listsearch`
- **Description**: Search all tests with pagination and filters.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/tests/listsearch",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "search": "math",
    "filters": { "status": "published", "type": "plain" },
    "limit": 10,
    "offset": 0
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.search",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "content": [
      {
        "testId": "d3e4f567-e89b-12d3-a456-426614174000",
        "title": "Math Fundamentals Test",
        "type": "plain",
        "status": "published"
      }
    ],
    "totalElements": 1
  }
}
```

**4. Get Test by ID**

- **Method**: `GET`
- **URL**: `/assessment/v1/tests/{id}`
- **Description**: Get a test by ID.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000",
  "pathParams": { "id": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.read",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "title": "Math Fundamentals Test",
    "type": "plain",
    "status": "published",
    "totalMarks": 100,
    "passingMarks": 50,
    "timeDuration": 3600,
    "attempts": 3,
    "allowResubmission": false,
    "gradingType": "quiz",
    "createdAt": "2025-08-11T06:06:19.896Z",
    "updatedAt": "2025-08-11T06:06:19.896Z"
  }
}
```

**5. Update Test**

- **Method**: `PATCH`
- **URL**: `/assessment/v1/tests/{id}`
- **Description**: Update a test.
- **Request Headers:**

```json
{
  "method": "PATCH",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000",
  "pathParams": { "id": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "title": "Math Fundamentals Test - Updated",
    "status": "published",
    "passingMarks": 60
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.update",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "title": "Math Fundamentals Test - Updated",
    "status": "published",
    "passingMarks": 60
  }
}
```

**6. Delete Test**

- **Method**: `DELETE`
- **URL**: `/assessment/v1/tests/{id}`
- **Description**: Delete a test (soft delete by default).
- **Request Headers:**

```json
{
  "method": "DELETE",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000",
  "pathParams": { "id": "d3e4f567-e89b-12d3-a456-426614174000" },
  "queryParams": { "hard": "false" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.delete",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "success": true, "message": "Test deleted successfully" }
}
```

**7. Get Test Hierarchy (Learner View)**

- **Method**: `GET`
- **URL**: `/assessment/v1/tests/{id}/hierarchy`
- **Description**: Get test hierarchy with sections and questions for learner — without correct options.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000/hierarchy",
  "pathParams": { "id": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.hierarchy",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "title": "Math Fundamentals Test",
    "sections": [
      {
        "sectionId": "sec-001",
        "title": "Algebra",
        "questions": [
          {
            "questionId": "q-001",
            "text": "What is 2 + 2?",
            "type": "mcq",
            "marks": 5,
            "options": [
              { "optionId": "o-1", "text": "3" },
              { "optionId": "o-2", "text": "4" },
              { "optionId": "o-3", "text": "5" }
            ]
          }
        ]
      }
    ]
  }
}
```

**8. Get Test Hierarchy (Admin View)**

- **Method**: `GET`
- **URL**: `/assessment/v1/tests/{id}/test-hierarchy`
- **Description**: Get test hierarchy with sections and questions with correct options — for admin.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000/test-hierarchy",
  "pathParams": { "id": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.test-hierarchy",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "title": "Math Fundamentals Test",
    "sections": [
      {
        "sectionId": "sec-001",
        "title": "Algebra",
        "questions": [
          {
            "questionId": "q-001",
            "text": "What is 2 + 2?",
            "type": "mcq",
            "marks": 5,
            "options": [
              { "optionId": "o-1", "text": "3", "isCorrect": false },
              { "optionId": "o-2", "text": "4", "isCorrect": true },
              { "optionId": "o-3", "text": "5", "isCorrect": false }
            ]
          }
        ]
      }
    ]
  }
}
```

**9. Add Question to Test**

- **Method**: `POST`
- **URL**: `/assessment/v1/tests/{id}/questions`
- **Description**: Add a question to a test section.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000/questions",
  "pathParams": { "id": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "sectionId": "sec-001",
    "questionId": "q-001",
    "isCompulsory": true,
    "order": 1
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.addquestion",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 201,
  "result": { "message": "Question added to test successfully" }
}
```

**10. Add Questions in Bulk**

- **Method**: `POST`
- **URL**: `/assessment/v1/tests/{id}/questions/bulk`
- **Description**: Add multiple questions to a test section in bulk.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000/questions/bulk",
  "pathParams": { "id": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "sectionId": "sec-001",
    "questions": [
      { "questionId": "q-001", "isCompulsory": true, "order": 1 },
      { "questionId": "q-002", "isCompulsory": false, "order": 2 }
    ]
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.bulkaddquestion",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 201,
  "result": {
    "message": "Questions added to test successfully",
    "added": 2,
    "skipped": 0,
    "errors": []
  }
}
```

**11. Remove Question from Test**

- **Method**: `DELETE`
- **URL**: `/assessment/v1/tests/{testId}/question/{questionId}`
- **Description**: Remove a question from a test.
- **Request Headers:**

```json
{
  "method": "DELETE",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000/question/q-001",
  "pathParams": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "questionId": "q-001"
  },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.removequestion",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "message": "Question removed from test successfully" }
}
```

**12. Check User Test Status**

- **Method**: `GET`
- **URL**: `/assessment/v1/tests/{testId}/users/{userId}/status`
- **Description**: Check user test status and attempt limits.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000/users/35113bfc-adce-47fc-b85d-871cbcb00bcc/status",
  "pathParams": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "userId": "35113bfc-adce-47fc-b85d-871cbcb00bcc"
  },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.userstatus",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "canAttempt": true,
    "maxAttempts": 3,
    "attemptsMade": 1,
    "canResume": false,
    "lastAttemptId": "atm-001"
  }
}
```

**13. Update Test Structure**

- **Method**: `PUT`
- **URL**: `/assessment/v1/tests/{testId}/structure`
- **Description**: Update complete test structure with sections and questions.
- **Request Headers:**

```json
{
  "method": "PUT",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000/structure",
  "pathParams": { "testId": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "sections": [
      {
        "sectionId": "sec-001",
        "order": 1,
        "questions": [
          { "questionId": "q-001", "order": 1, "isCompulsory": true }
        ]
      }
    ]
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.structure",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "message": "Test structure updated successfully" }
}
```

**14. Get Question-Answer Report**

- **Method**: `GET`
- **URL**: `/assessment/v1/tests/{testId}/question-answer-report`
- **Description**: Generate question-answer report for a test.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000/question-answer-report",
  "pathParams": { "testId": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.report",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "totalAttempts": 25,
    "averageScore": 72.5,
    "questions": [
      {
        "questionId": "q-001",
        "text": "What is 2 + 2?",
        "correctResponseRate": 0.88,
        "averageScore": 4.4
      }
    ]
  }
}
```

**15. Clone Test**

- **Method**: `POST`
- **URL**: `/assessment/v1/tests/{testId}/clone`
- **Description**: Clone a test (creates a deep copy including sections, questions, and rules).
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/tests/d3e4f567-e89b-12d3-a456-426614174000/clone",
  "pathParams": { "testId": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.test.clone",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 201,
  "result": {
    "message": "Test cloned successfully",
    "clonedTestId": "c1a2b3c4-e89b-12d3-a456-426614174000"
  }
}
```

## 5. Test Sections

**1. Create Section**

- **Method**: `POST`
- **URL**: `/assessment/v1/sections`
- **Description**: Create a new section.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/sections",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "title": "Algebra",
    "description": "Questions on algebra fundamentals",
    "order": 1,
    "totalMarks": 50
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.section.create",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 201,
  "result": {
    "sectionId": "sec-001",
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "title": "Algebra",
    "order": 1,
    "totalMarks": 50,
    "createdAt": "2025-08-11T06:06:19.896Z"
  }
}
```

**2. List All Sections**

- **Method**: `GET`
- **URL**: `/assessment/v1/sections`
- **Description**: List all sections.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/sections",
  "queryParams": { "limit": 10, "offset": 0 },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.section.list",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "sections": [
      { "sectionId": "sec-001", "title": "Algebra", "order": 1 }
    ],
    "totalElements": 1
  }
}
```

**3. List Sections for a Test**

- **Method**: `GET`
- **URL**: `/assessment/v1/sections/test/{testId}`
- **Description**: List all sections for a specific test.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/sections/test/d3e4f567-e89b-12d3-a456-426614174000",
  "pathParams": { "testId": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.section.listbytest",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "sections": [
      { "sectionId": "sec-001", "title": "Algebra", "order": 1 },
      { "sectionId": "sec-002", "title": "Geometry", "order": 2 }
    ]
  }
}
```

**4. Get Section by ID**

- **Method**: `GET`
- **URL**: `/assessment/v1/sections/{id}`
- **Description**: Get a section by ID.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/sections/sec-001",
  "pathParams": { "id": "sec-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.section.read",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "sectionId": "sec-001",
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "title": "Algebra",
    "description": "Questions on algebra fundamentals",
    "order": 1,
    "totalMarks": 50
  }
}
```

**5. Update Section**

- **Method**: `PATCH`
- **URL**: `/assessment/v1/sections/{id}`
- **Description**: Update a section.
- **Request Headers:**

```json
{
  "method": "PATCH",
  "url": "http://localhost:3000/assessment/v1/sections/sec-001",
  "pathParams": { "id": "sec-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "title": "Algebra - Updated",
    "totalMarks": 60
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.section.update",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "sectionId": "sec-001", "title": "Algebra - Updated", "totalMarks": 60 }
}
```

**6. Delete Section**

- **Method**: `DELETE`
- **URL**: `/assessment/v1/sections/{id}`
- **Description**: Delete a section.
- **Request Headers:**

```json
{
  "method": "DELETE",
  "url": "http://localhost:3000/assessment/v1/sections/sec-001",
  "pathParams": { "id": "sec-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.section.delete",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "success": true, "message": "Section deleted successfully" }
}
```

## 6. Test Rules

**1. Create Rule**

- **Method**: `POST`
- **URL**: `/assessment/v1/rules`
- **Description**: Create a new test rule.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/rules",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "sectionId": "sec-001",
    "totalQuestions": 10,
    "criteria": {
      "type": "mcq",
      "level": "medium",
      "tags": ["algebra", "math"]
    }
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.rule.create",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 201,
  "result": {
    "ruleId": "rule-001",
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "sectionId": "sec-001",
    "totalQuestions": 10,
    "createdAt": "2025-08-11T06:06:19.896Z"
  }
}
```

**2. List All Rules**

- **Method**: `GET`
- **URL**: `/assessment/v1/rules`
- **Description**: List all rules with optional filters.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/rules",
  "queryParams": { "limit": 10, "offset": 0 },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.rule.list",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "rules": [
      { "ruleId": "rule-001", "testId": "d3e4f567-e89b-12d3-a456-426614174000", "totalQuestions": 10 }
    ],
    "totalElements": 1
  }
}
```

**3. Get Rule by ID**

- **Method**: `GET`
- **URL**: `/assessment/v1/rules/{id}`
- **Description**: Get a rule by ID.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/rules/rule-001",
  "pathParams": { "id": "rule-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.rule.read",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "ruleId": "rule-001",
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "sectionId": "sec-001",
    "totalQuestions": 10,
    "criteria": { "type": "mcq", "level": "medium" }
  }
}
```

**4. Update Rule**

- **Method**: `PATCH`
- **URL**: `/assessment/v1/rules/{id}`
- **Description**: Update a rule.
- **Request Headers:**

```json
{
  "method": "PATCH",
  "url": "http://localhost:3000/assessment/v1/rules/rule-001",
  "pathParams": { "id": "rule-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": { "totalQuestions": 15, "criteria": { "level": "hard" } }
}
```

- **Response:**

```json
{
  "id": "api.assessment.rule.update",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "ruleId": "rule-001", "totalQuestions": 15 }
}
```

**5. Delete Rule**

- **Method**: `DELETE`
- **URL**: `/assessment/v1/rules/{id}`
- **Description**: Delete a rule.
- **Request Headers:**

```json
{
  "method": "DELETE",
  "url": "http://localhost:3000/assessment/v1/rules/rule-001",
  "pathParams": { "id": "rule-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.rule.delete",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "success": true, "message": "Rule deleted successfully" }
}
```

**6. Get Rules for a Test**

- **Method**: `GET`
- **URL**: `/assessment/v1/rules/test/{testId}`
- **Description**: Get all rules for a specific test.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/rules/test/d3e4f567-e89b-12d3-a456-426614174000",
  "pathParams": { "testId": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.rule.listbytest",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "rules": [
      { "ruleId": "rule-001", "sectionId": "sec-001", "totalQuestions": 10 }
    ]
  }
}
```

**7. Get Rules for a Section**

- **Method**: `GET`
- **URL**: `/assessment/v1/rules/section/{sectionId}`
- **Description**: Get all rules for a specific section.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/rules/section/sec-001",
  "pathParams": { "sectionId": "sec-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.rule.listbysection",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "sectionId": "sec-001",
    "rules": [
      { "ruleId": "rule-001", "totalQuestions": 10, "criteria": { "type": "mcq" } }
    ]
  }
}
```

**8. Get Rule Preview**

- **Method**: `GET`
- **URL**: `/assessment/v1/rules/{ruleId}/preview`
- **Description**: Get rule preview with metadata.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/rules/rule-001/preview",
  "pathParams": { "ruleId": "rule-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.rule.preview",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "ruleId": "rule-001",
    "totalMatchingQuestions": 42,
    "criteria": { "type": "mcq", "level": "medium" },
    "sampleQuestions": [
      { "questionId": "q-001", "text": "What is 2+2?", "type": "mcq" }
    ]
  }
}
```

**9. Get Questions by Rule Criteria**

- **Method**: `POST`
- **URL**: `/assessment/v1/rules/{ruleId}/questions`
- **Description**: Get questions based on rule criteria for pre-selection.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/rules/rule-001/questions",
  "pathParams": { "ruleId": "rule-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": { "limit": 10, "offset": 0 }
}
```

- **Response:**

```json
{
  "id": "api.assessment.rule.questions",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "questions": [
      { "questionId": "q-001", "text": "What is 2+2?", "type": "mcq", "level": "medium" }
    ],
    "totalElements": 1
  }
}
```

## 7. Questions

**1. Create Question**

- **Method**: `POST`
- **URL**: `/assessment/v1/questions`
- **Description**: Create a new question.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/questions",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "text": "What is the capital of France?",
    "type": "mcq",
    "level": "medium",
    "marks": 5,
    "gradingType": "quiz",
    "options": [
      { "text": "London", "isCorrect": false, "position": 1 },
      { "text": "Paris", "isCorrect": true, "position": 2 },
      { "text": "Berlin", "isCorrect": false, "position": 3 },
      { "text": "Madrid", "isCorrect": false, "position": 4 }
    ]
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.question.create",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 201,
  "result": {
    "questionId": "q-001",
    "text": "What is the capital of France?",
    "type": "mcq",
    "level": "medium",
    "marks": 5,
    "status": "draft",
    "createdAt": "2025-08-11T06:06:19.896Z"
  }
}
```

**2. Get All Questions**

- **Method**: `GET`
- **URL**: `/assessment/v1/questions`
- **Description**: Get all questions with pagination and filters.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/questions",
  "queryParams": {
    "limit": 10,
    "offset": 0,
    "type": "mcq",
    "level": "medium",
    "status": "published"
  },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.question.list",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "questions": [
      { "questionId": "q-001", "text": "What is the capital of France?", "type": "mcq", "level": "medium", "marks": 5 }
    ],
    "totalElements": 1,
    "limit": 10,
    "offset": 0
  }
}
```

**3. Get Question by ID**

- **Method**: `GET`
- **URL**: `/assessment/v1/questions/{id}`
- **Description**: Get a question by ID.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/questions/q-001",
  "pathParams": { "id": "q-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.question.read",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "questionId": "q-001",
    "text": "What is the capital of France?",
    "type": "mcq",
    "level": "medium",
    "marks": 5,
    "status": "published",
    "options": [
      { "optionId": "o-1", "text": "London", "isCorrect": false, "position": 1 },
      { "optionId": "o-2", "text": "Paris", "isCorrect": true, "position": 2 }
    ]
  }
}
```

**4. Update Question**

- **Method**: `PATCH`
- **URL**: `/assessment/v1/questions/{id}`
- **Description**: Update a question.
- **Request Headers:**

```json
{
  "method": "PATCH",
  "url": "http://localhost:3000/assessment/v1/questions/q-001",
  "pathParams": { "id": "q-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "text": "What is the capital city of France?",
    "marks": 10,
    "status": "published"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.question.update",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "questionId": "q-001", "text": "What is the capital city of France?", "marks": 10 }
}
```

**5. Delete Question**

- **Method**: `DELETE`
- **URL**: `/assessment/v1/questions/{id}`
- **Description**: Delete a question.
- **Request Headers:**

```json
{
  "method": "DELETE",
  "url": "http://localhost:3000/assessment/v1/questions/q-001",
  "pathParams": { "id": "q-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.question.delete",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "success": true, "message": "Question deleted successfully" }
}
```

**6. Preview Questions for Rule Criteria**

- **Method**: `POST`
- **URL**: `/assessment/v1/questions/rule-preview`
- **Description**: Preview questions for rule criteria.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/questions/rule-preview",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "criteria": { "type": "mcq", "level": "medium", "tags": ["math"] },
    "limit": 5
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.question.rulepreview",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "totalMatching": 24,
    "questions": [
      { "questionId": "q-001", "text": "What is 2+2?", "type": "mcq", "level": "medium" }
    ]
  }
}
```

**7. Associate Question with Option**

- **Method**: `POST`
- **URL**: `/assessment/v1/questions/associate-option`
- **Description**: Associate a question with an option.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/questions/associate-option",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "questionId": "q-001",
    "optionId": "o-002"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.question.associateoption",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "message": "Option associated with question successfully" }
}
```

**8. Disassociate Question from Option**

- **Method**: `POST`
- **URL**: `/assessment/v1/questions/disassociate-option`
- **Description**: Remove association between a question and an option.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/questions/disassociate-option",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "questionId": "q-001",
    "optionId": "o-002"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.question.disassociateoption",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "message": "Option disassociated from question successfully" }
}
```

**9. Get Child Questions**

- **Method**: `GET`
- **URL**: `/assessment/v1/questions/{id}/child-questions`
- **Description**: Get child questions of a parent question.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/questions/q-001/child-questions",
  "pathParams": { "id": "q-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.question.childquestions",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "parentQuestionId": "q-001",
    "childQuestions": [
      { "questionId": "q-001-a", "text": "Part (a): Solve for x", "type": "subjective" },
      { "questionId": "q-001-b", "text": "Part (b): Verify your answer", "type": "subjective" }
    ]
  }
}
```

## 8. Test Attempts

**1. Start Test Attempt**

- **Method**: `POST`
- **URL**: `/assessment/v1/attempts/start/{testId}`
- **Description**: Start a new test attempt.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/attempts/start/d3e4f567-e89b-12d3-a456-426614174000",
  "pathParams": { "testId": "d3e4f567-e89b-12d3-a456-426614174000" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "userId": "<USER_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {}
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.start",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 201,
  "result": {
    "attemptId": "atm-001",
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "userId": "35113bfc-adce-47fc-b85d-871cbcb00bcc",
    "status": "in_progress",
    "startedAt": "2025-08-11T06:06:19.896Z",
    "expiresAt": "2025-08-11T07:06:19.896Z"
  }
}
```

**2. Resume Test Attempt**

- **Method**: `GET`
- **URL**: `/assessment/v1/attempts/{attemptId}/resume/{userId}`
- **Description**: Get / Resume an in-progress attempt.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/attempts/atm-001/resume/35113bfc-adce-47fc-b85d-871cbcb00bcc",
  "pathParams": {
    "attemptId": "atm-001",
    "userId": "35113bfc-adce-47fc-b85d-871cbcb00bcc"
  },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.resume",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "attemptId": "atm-001",
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "userId": "35113bfc-adce-47fc-b85d-871cbcb00bcc",
    "status": "in_progress",
    "answeredQuestions": 3,
    "totalQuestions": 10,
    "timeRemaining": 2800
  }
}
```

**3. Get Questions for Attempt**

- **Method**: `GET`
- **URL**: `/assessment/v1/attempts/{attemptId}/questions/{userId}`
- **Description**: Get questions for an attempt.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/attempts/atm-001/questions/35113bfc-adce-47fc-b85d-871cbcb00bcc",
  "pathParams": {
    "attemptId": "atm-001",
    "userId": "35113bfc-adce-47fc-b85d-871cbcb00bcc"
  },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.questions",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "attemptId": "atm-001",
    "questions": [
      {
        "questionId": "q-001",
        "text": "What is the capital of France?",
        "type": "mcq",
        "marks": 5,
        "options": [
          { "optionId": "o-1", "text": "London" },
          { "optionId": "o-2", "text": "Paris" }
        ]
      }
    ],
    "totalQuestions": 10
  }
}
```

**4. Submit Answers**

- **Method**: `POST`
- **URL**: `/assessment/v1/attempts/{attemptId}/answers`
- **Description**: Submit multiple answers for questions.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/attempts/atm-001/answers",
  "pathParams": { "attemptId": "atm-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "answers": [
      {
        "questionId": "q-001",
        "selectedOptions": ["o-2"]
      },
      {
        "questionId": "q-002",
        "textAnswer": "Photosynthesis is the process by which plants make food."
      }
    ]
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.submitanswers",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "message": "Answers submitted successfully",
    "answeredCount": 2
  }
}
```

**5. Submit Test Attempt**

- **Method**: `POST`
- **URL**: `/assessment/v1/attempts/{attemptId}/submit`
- **Description**: Submit a test attempt (finalize).
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/attempts/atm-001/submit",
  "pathParams": { "attemptId": "atm-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {}
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.submit",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "attemptId": "atm-001",
    "status": "submitted",
    "score": 75,
    "totalMarks": 100,
    "percentage": 75,
    "passed": true,
    "submittedAt": "2025-08-11T06:50:00.000Z"
  }
}
```

**6. Review Attempt (Subjective Questions)**

- **Method**: `POST`
- **URL**: `/assessment/v1/attempts/{attemptId}/review`
- **Description**: Review a test attempt for subjective questions.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/attempts/atm-001/review",
  "pathParams": { "attemptId": "atm-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "reviews": [
      {
        "questionId": "q-002",
        "marksAwarded": 8,
        "feedback": "Good explanation but missed one key point."
      }
    ]
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.review",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": { "message": "Attempt reviewed successfully", "reviewedCount": 1 }
}
```

**7. Get Pending Reviews**

- **Method**: `GET`
- **URL**: `/assessment/v1/attempts/reviews/pending`
- **Description**: Get pending reviews for subjective questions.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/attempts/reviews/pending",
  "queryParams": { "limit": 10, "offset": 0 },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.pendingreview",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "pending": [
      {
        "attemptId": "atm-002",
        "testId": "d3e4f567-e89b-12d3-a456-426614174000",
        "userId": "user-xyz",
        "submittedAt": "2025-08-10T14:00:00.000Z",
        "pendingQuestions": 2
      }
    ],
    "totalElements": 1
  }
}
```

**8. Check Import Result Status**

- **Method**: `POST`
- **URL**: `/assessment/v1/attempts/import/resultstatus`
- **Description**: Check if result is imported for a user and test.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/attempts/import/resultstatus",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "userId": "35113bfc-adce-47fc-b85d-871cbcb00bcc"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.importstatus",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "imported": true,
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "userId": "35113bfc-adce-47fc-b85d-871cbcb00bcc",
    "importedAt": "2025-08-10T09:00:00.000Z"
  }
}
```

**9. Get Attempt Answersheet**

- **Method**: `GET`
- **URL**: `/assessment/v1/attempts/{attemptId}/answersheet`
- **Description**: Get attempt answersheet.
- **Request Headers:**

```json
{
  "method": "GET",
  "url": "http://localhost:3000/assessment/v1/attempts/atm-001/answersheet",
  "pathParams": { "attemptId": "atm-001" },
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.answersheet",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "attemptId": "atm-001",
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "userId": "35113bfc-adce-47fc-b85d-871cbcb00bcc",
    "answers": [
      {
        "questionId": "q-001",
        "questionText": "What is the capital of France?",
        "selectedOptions": ["o-2"],
        "correctOptions": ["o-2"],
        "isCorrect": true,
        "marksAwarded": 5,
        "totalMarks": 5
      }
    ],
    "totalScore": 75,
    "totalMarks": 100
  }
}
```

**10. Review Attempt by Test ID**

- **Method**: `POST`
- **URL**: `/assessment/v1/attempts/review`
- **Description**: Review a test attempt by testId.
- **Request Headers:**

```json
{
  "method": "POST",
  "url": "http://localhost:3000/assessment/v1/attempts/review",
  "headers": {
    "tenantId": "<TENANT_ID>",
    "organisationId": "<ORGANISATION_ID>",
    "Authorization": "Bearer <ACCESS_TOKEN>"
  },
  "body": {
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "userId": "35113bfc-adce-47fc-b85d-871cbcb00bcc",
    "reviews": [
      {
        "questionId": "q-002",
        "marksAwarded": 9,
        "feedback": "Excellent answer with strong reasoning."
      }
    ]
  }
}
```

- **Response:**

```json
{
  "id": "api.assessment.attempt.reviewbytest",
  "ver": "1.0",
  "ts": "2025-08-11T06:06:19.896Z",
  "params": { "status": "successful", "err": null, "errmsg": null },
  "responseCode": 200,
  "result": {
    "message": "Attempt reviewed successfully",
    "testId": "d3e4f567-e89b-12d3-a456-426614174000",
    "reviewedBy": "35113bfc-adce-47fc-b85d-871cbcb00bcc"
  }
}
```
