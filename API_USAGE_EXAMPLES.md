# API Usage Examples

## Authentication Headers

All API endpoints require the following headers for multi-tenancy:

- `tenantId`: Your tenant identifier
- `organisationId`: Your organisation identifier
- `userId`: User identifier (optional, defaults to 'system')

## Examples

### 1. Create a Test

```bash
curl -X POST http://localhost:3000/assessment/v1/tests \
  -H "Content-Type: application/json" \
  -H "tenantId: tenant-123" \
  -H "organisationId: org-456" \
  -H "userId: user-789" \
  -d '{
    "type": "plain",
    "title": "Sample Test",
    "description": "A sample test for demonstration",
    "totalMarks": 100,
    "passingMarks": 60
  }'
```

**Response:**
```json
{
  "testId": "uuid-here"
}
```

### 2. Get All Tests

```bash
curl -X GET "http://localhost:3000/assessment/v1/tests?limit=10&offset=0" \
  -H "tenantId: tenant-123" \
  -H "organisationId: org-456"
```

### 3. Create a Question

```bash
curl -X POST http://localhost:3000/assessment/v1/questions \
  -H "Content-Type: application/json" \
  -H "tenantId: tenant-123" \
  -H "organisationId: org-456" \
  -d '{
    "title": "What is 2 + 2?",
    "type": "mcq",
    "difficultyLevel": "easy",
    "marks": 5
  }'
```

### 4. Start a Test Attempt

```bash
curl -X POST http://localhost:3000/assessment/v1/attempts/start/test-uuid-here \
  -H "tenantId: tenant-123" \
  -H "organisationId: org-456" \
  -H "userId: user-789"
```

## Rule-Based Test Creation - Two Approaches

### Approach A: Pre-selected Questions (PRESELECTED mode)

#### 1. Create Rule with PRESELECTED mode
```bash
curl -X POST http://localhost:3000/rules \
  -H "Content-Type: application/json" \
  -H "tenantId: 123e4567-e89b-12d3-a456-426614174000" \
  -H "organisationId: 123e4567-e89b-12d3-a456-426614174001" \
  -H "userId: 123e4567-e89b-12d3-a456-426614174002" \
  -d '{
    "testId": "test-123",
    "sectionId": "section-456",
    "name": "Math Questions",
    "description": "Random math questions",
    "criteria": {
      "categories": ["mathematics"],
      "difficultyLevels": ["easy", "medium"],
      "questionTypes": ["mcq"],
      "marks": [1, 2]
    },
    "numberOfQuestions": 5,
    "poolSize": 20,
    "selectionStrategy": "random",
    "selectionMode": "PRESELECTED"
  }'
```

#### 2. Get Questions Based on Criteria
```bash
curl -X POST http://localhost:3000/rules/rule-123/questions \
  -H "tenantId: 123e4567-e89b-12d3-a456-426614174000" \
  -H "organisationId: 123e4567-e89b-12d3-a456-426614174001" \
  -H "userId: 123e4567-e89b-12d3-a456-426614174002"
```

Response:
```json
{
  "rule": { ... },
  "questions": [
    {
      "questionId": "q1",
      "title": "What is 2+2?",
      "type": "mcq",
      "marks": 1
    },
    {
      "questionId": "q2", 
      "title": "What is 5x5?",
      "type": "mcq",
      "marks": 2
    }
  ],
  "totalCount": 15,
  "canGeneratePool": true,
  "canCreateTest": true
}
```

#### 3. Add Selected Questions to TestQuestions Table
```bash
curl -X POST http://localhost:3000/tests/test-123/questions \
  -H "Content-Type: application/json" \
  -H "tenantId: 123e4567-e89b-12d3-a456-426614174000" \
  -H "organisationId: 123e4567-e89b-12d3-a456-426614174001" \
  -H "userId: 123e4567-e89b-12d3-a456-426614174002" \
  -d '[
    {
      "questionId": "q1",
      "sectionId": "section-456",
      "ruleId": "rule-123",
      "ordering": 1
    },
    {
      "questionId": "q2",
      "sectionId": "section-456", 
      "ruleId": "rule-123",
      "ordering": 2
    }
  ]'
```

### Approach B: Dynamic Criteria-based Selection (DYNAMIC mode)

#### 1. Create Rule with DYNAMIC mode
```bash
curl -X POST http://localhost:3000/rules \
  -H "Content-Type: application/json" \
  -H "tenantId: 123e4567-e89b-12d3-a456-426614174000" \
  -H "organisationId: 123e4567-e89b-12d3-a456-426614174001" \
  -H "userId: 123e4567-e89b-12d3-a456-426614174002" \
  -d '{
    "testId": "test-123",
    "sectionId": "section-456",
    "name": "Dynamic Math Questions",
    "description": "Dynamically selected math questions",
    "criteria": {
      "categories": ["mathematics"],
      "difficultyLevels": ["easy", "medium"],
      "questionTypes": ["mcq"],
      "marks": [1, 2]
    },
    "numberOfQuestions": 5,
    "poolSize": 20,
    "selectionStrategy": "random",
    "selectionMode": "DYNAMIC"
  }'
```

#### 2. Validate Rule and Check Question Availability
```bash
curl -X GET http://localhost:3000/rules/rule-123/preview \
  -H "tenantId: 123e4567-e89b-12d3-a456-426614174000" \
  -H "organisationId: 123e4567-e89b-12d3-a456-426614174001" \
  -H "userId: 123e4567-e89b-12d3-a456-426614174002"
```

Response:
```json
{
  "rule": { ... },
  "metadata": {
    "totalQuestionsMatching": 25,
    "canGeneratePool": true,
    "canCreateTest": true,
    "poolSize": 20,
    "numberOfQuestions": 5
  }
}
```

### User Attempt (Same for Both Approaches)

#### 1. Start Attempt
```bash
curl -X POST http://localhost:3000/attempts/start \
  -H "Content-Type: application/json" \
  -H "tenantId: 123e4567-e89b-12d3-a456-426614174000" \
  -H "organisationId: 123e4567-e89b-12d3-a456-426614174001" \
  -H "userId: 123e4567-e89b-12d3-a456-426614174002" \
  -d '{
    "testId": "test-123"
  }'
```

#### 2. Get Questions for Attempt
```bash
curl -X GET http://localhost:3000/attempts/attempt-123/questions \
  -H "tenantId: 123e4567-e89b-12d3-a456-426614174000" \
  -H "organisationId: 123e4567-e89b-12d3-a456-426614174001" \
  -H "userId: 123e4567-e89b-12d3-a456-426614174002"
```

## Key Differences

| Aspect | Approach A (PRESELECTED) | Approach B (DYNAMIC) |
|--------|--------------------------|----------------------|
| **Question Selection** | Pre-selected by admin | Dynamic during attempt |
| **Performance** | Faster (pre-selected) | Slower (runtime query) |
| **Flexibility** | Limited to pre-selected | Maximum flexibility |
| **Control** | Full admin control | System-driven |
| **Use Case** | Curated question sets | Large question banks |
| **API Calls** | More (preview + selection) | Fewer (just validation) |

## JavaScript/Node.js Example

```javascript
const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/assessment/v1',
  headers: {
    'Content-Type': 'application/json',
    'tenantId': 'tenant-123',
    'organisationId': 'org-456',
    'userId': 'user-789'
  }
});

// Create a test
const createTest = async () => {
  try {
    const response = await apiClient.post('/tests', {
      type: 'plain',
      title: 'Sample Test',
      description: 'A sample test',
      totalMarks: 100,
      passingMarks: 60
    });
    
    console.log('Test created:', response.data);
    return response.data.testId;
  } catch (error) {
    console.error('Error creating test:', error.response.data);
  }
};

// Get all tests
const getTests = async () => {
  try {
    const response = await apiClient.get('/tests?limit=10&offset=0');
    console.log('Tests:', response.data);
  } catch (error) {
    console.error('Error getting tests:', error.response.data);
  }
};
```

## Python Example

```python
import requests

# Base configuration
base_url = 'http://localhost:3000/assessment/v1'
headers = {
    'Content-Type': 'application/json',
    'tenantId': 'tenant-123',
    'organisationId': 'org-456',
    'userId': 'user-789'
}

# Create a test
def create_test():
    data = {
        'type': 'plain',
        'title': 'Sample Test',
        'description': 'A sample test',
        'totalMarks': 100,
        'passingMarks': 60
    }
    
    response = requests.post(
        f'{base_url}/tests',
        json=data,
        headers=headers
    )
    
    if response.status_code == 201:
        return response.json()['testId']
    else:
        print(f'Error: {response.status_code} - {response.text}')

# Get all tests
def get_tests():
    response = requests.get(
        f'{base_url}/tests?limit=10&offset=0',
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Error: {response.status_code} - {response.text}')
```

## Error Responses

### Missing Headers
```json
{
  "statusCode": 400,
  "message": "tenantId header is required",
  "error": "Bad Request"
}
```

### Invalid Tenant/Organisation
```json
{
  "statusCode": 404,
  "message": "Test not found",
  "error": "Not Found"
}
```

## Important Notes

1. **Multi-tenancy**: All data is isolated by `tenantId` and `organisationId`
2. **Headers are required**: Every request must include the tenant and organisation headers
3. **User ID**: Optional but recommended for audit trails
4. **Caching**: Responses are cached per tenant for performance
5. **Rate limiting**: 100 requests per minute per IP address 

## Questions with Rich Content

### Creating a Question with Text Only

```json
{
  "text": "What is the capital of France?",
  "media": null,
  "type": "mcq",
  "marks": 1,
  "options": [
    {
      "text": "Paris",
      "media": null,
      "isCorrect": true
    },
    {
      "text": "London",
      "media": null,
      "isCorrect": false
    },
    {
      "text": "Berlin",
      "media": null,
      "isCorrect": false
    }
  ]
}
```

### Creating a Question with Image

```json
{
  "text": "Identify the landmark shown in this image:",
  "media": {
    "image": "https://cdn.example.com/eiffel-tower.jpg"
  },
  "type": "mcq",
  "marks": 2,
  "options": [
    {
      "text": "Eiffel Tower",
      "media": null,
      "isCorrect": true
    },
    {
      "text": "Big Ben",
      "media": null,
      "isCorrect": false
    }
  ]
}
```

### Creating a Question with Video

```json
{
  "text": "Watch the video and answer the question:",
  "media": {
    "video": "https://cdn.example.com/chemistry-experiment.mp4"
  },
  "type": "subjective",
  "marks": 5,
  "gradingType": "exercise"
}
```

### Creating a Question with Multiple Media Types

```json
{
  "text": "Study the materials and answer the question:",
  "media": {
    "image": "https://cdn.example.com/diagram.png",
    "video": "https://cdn.example.com/explanation.mp4",
    "document": "https://cdn.example.com/reference.pdf"
  },
  "type": "essay",
  "marks": 10,
  "gradingType": "exercise"
}
```

### Creating a Matching Question

```json
{
  "text": "Match the countries with their capitals:",
  "media": null,
  "type": "match",
  "marks": 3,
  "options": [
    {
      "text": "France",
      "media": null,
      "matchWith": "Paris",
      "matchWithMedia": null,
      "isCorrect": true
    },
    {
      "text": "Germany",
      "media": null,
      "matchWith": "Berlin",
      "matchWithMedia": null,
      "isCorrect": true
    }
  ]
}
```

### Creating a Matching Question with Media

```json
{
  "text": "Match the flags with their countries:",
  "media": null,
  "type": "match",
  "marks": 3,
  "options": [
    {
      "text": "France",
      "media": {
        "image": "https://cdn.example.com/france-flag.png"
      },
      "matchWith": "Paris",
      "matchWithMedia": {
        "image": "https://cdn.example.com/paris-landmark.png"
      },
      "isCorrect": true
    }
  ]
}
```

### Creating a Fill-in-the-Blank Question

```json
{
  "text": "Complete the sentence: The capital of France is _____.",
  "media": null,
  "type": "fill_blank",
  "marks": 1,
  "options": [
    {
      "text": "Paris",
      "media": null,
      "blankIndex": 1,
      "isCorrect": true,
      "caseSensitive": false
    }
  ]
}
```

### Creating an Option with Media

```json
{
  "text": "Which city is shown in this image?",
  "media": null,
  "type": "mcq",
  "marks": 2,
  "options": [
    {
      "text": "Paris",
      "media": {
        "image": "https://cdn.example.com/paris-option.png"
      },
      "isCorrect": true
    },
    {
      "text": "London",
      "media": {
        "image": "https://cdn.example.com/london-option.png"
      },
      "isCorrect": false
    }
  ]
}
```

## Media Structure

The `media` field is a JSONB object that can contain URLs for different media types:

```json
{
  "image": "https://cdn.example.com/image.jpg",
  "video": "https://cdn.example.com/video.mp4",
  "audio": "https://cdn.example.com/audio.mp3",
  "document": "https://cdn.example.com/document.pdf"
}
```

### Media Properties

- **image**: URL to an image file (JPG, PNG, GIF, etc.)
- **video**: URL to a video file (MP4, WebM, etc.)
- **audio**: URL to an audio file (MP3, WAV, etc.)
- **document**: URL to a document file (PDF, DOC, etc.)

### Notes

- All media fields are optional
- You can include multiple media types in a single object
- The `matchWithMedia` field follows the same structure as `media`
- For questions and options without media, set `media` to `null` or omit the field 