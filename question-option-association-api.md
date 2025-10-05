# Question-Option Association API Endpoints

## Overview
This document describes the new API endpoints for associating questions with options, enabling conditional question functionality where a single child question can be triggered by multiple options from a parent question.

## Endpoints

### 1. Associate Question with Option

**POST** `/assessment/v1/questions/associate-option`

Creates an association between a question and an option, making the question a conditional child question.

#### Request Body
```json
{
  "questionId": "string (UUID)",
  "optionId": "string (UUID)"
}
```

#### Validation Rules
- `questionId` must exist and belong to the tenant/organization
- `optionId` must exist and belong to the tenant/organization
- The question must have a `parentId` set
- The question's `parentId` must match the option's `questionId`
- The association must not already exist

#### Success Response (201)
```json
{
  "success": true,
  "message": "Question successfully associated with option",
  "data": null,
  "timestamp": "2025-10-05T15:36:06.675Z"
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Question parentId must match the option's questionId",
  "errors": [],
  "timestamp": "2025-10-05T15:36:06.675Z"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Question not found",
  "errors": [],
  "timestamp": "2025-10-05T15:36:06.675Z"
}
```

### 2. Disassociate Question from Option

**POST** `/assessment/v1/questions/disassociate-option`

Removes the association between a question and an option.

#### Request Body
```json
{
  "questionId": "string (UUID)",
  "optionId": "string (UUID)"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Question successfully disassociated from option",
  "data": null,
  "timestamp": "2025-10-05T15:36:21.449Z"
}
```

#### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "message": "Question-option association not found",
  "errors": [],
  "timestamp": "2025-10-05T15:36:21.449Z"
}
```

## Usage Examples

### Example 1: Associate Child Question with Multiple Options

```bash
# First, associate with option 1
curl -X POST "http://localhost:6000/assessment/v1/questions/associate-option" \
  -H "Content-Type: application/json" \
  -H "tenantid: ef99949b-7f3a-4a5f-806a-e67e683e38f3" \
  -H "organisationid: d36d9079-0f42-4ba3-be03-26c9e79509ee" \
  -H "userid: 35113bfc-adce-47fc-b85d-871cbcb00bcc" \
  -d '{
    "questionId": "90eeaae6-2338-421e-bc75-3b145c60e5f4",
    "optionId": "9f01280f-f97e-427a-b80f-1c49c7f857ce"
  }'

# Then, associate with option 2
curl -X POST "http://localhost:6000/assessment/v1/questions/associate-option" \
  -H "Content-Type: application/json" \
  -H "tenantid: ef99949b-7f3a-4a5f-806a-e67e683e38f3" \
  -H "organisationid: d36d9079-0f42-4ba3-be03-26c9e79509ee" \
  -H "userid: 35113bfc-adce-47fc-b85d-871cbcb00bcc" \
  -d '{
    "questionId": "90eeaae6-2338-421e-bc75-3b145c60e5f4",
    "optionId": "4699638c-bbe3-4a96-9128-b3e7dd72c1d9"
  }'
```

### Example 2: Remove Association

```bash
curl -X POST "http://localhost:6000/assessment/v1/questions/disassociate-option" \
  -H "Content-Type: application/json" \
  -H "tenantid: ef99949b-7f3a-4a5f-806a-e67e683e38f3" \
  -H "organisationid: d36d9079-0f42-4ba3-be03-26c9e79509ee" \
  -H "userid: 35113bfc-adce-47fc-b85d-871cbcb00bcc" \
  -d '{
    "questionId": "90eeaae6-2338-421e-bc75-3b145c60e5f4",
    "optionId": "4699638c-bbe3-4a96-9128-b3e7dd72c1d9"
  }'
```

## Database Impact

### Tables Affected

1. **`optionQuestions`** - Stores the question-option associations
   - `questionId` - References the child question
   - `optionId` - References the parent question's option
   - `ordering` - Order of association (0-based)
   - `isActive` - Whether the association is active

2. **`testQuestions`** - Updated `isConditional` flag
   - Set to `true` when question has any option associations
   - Set to `false` when question has no option associations

### Data Flow

1. **Association Creation**:
   - Validates question and option existence
   - Validates parent-child relationship
   - Creates record in `optionQuestions` table
   - Updates `isConditional` flag in `testQuestions`

2. **Association Removal**:
   - Removes record from `optionQuestions` table
   - Checks remaining associations for the question
   - Updates `isConditional` flag based on remaining associations

## Benefits

1. **Flexibility**: A single child question can be triggered by multiple options
2. **Reusability**: Reduces duplicate questions for similar conditional logic
3. **Maintainability**: Centralized management of question-option relationships
4. **Scalability**: Supports complex conditional question hierarchies
5. **API-First**: Clean REST endpoints for programmatic management

## Error Handling

The endpoints include comprehensive error handling for:
- Invalid UUIDs
- Non-existent questions or options
- Invalid parent-child relationships
- Duplicate associations
- Missing required fields

All errors return structured JSON responses with appropriate HTTP status codes and descriptive error messages.
