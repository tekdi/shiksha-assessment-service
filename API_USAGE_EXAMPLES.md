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