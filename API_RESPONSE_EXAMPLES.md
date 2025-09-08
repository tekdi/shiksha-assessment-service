# 📋 API Response Examples

## 🎯 Test Attempts

### Start Attempt
```json
POST /attempts/start/{testId}
Response:
{
  "attemptId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get Attempt Questions
```json 
GET /attempts/{attemptId}/questions
Response:
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Explain the concept of object-oriented programming",
    "type": "subjective",
    "marks": 10,
    "level": "medium",
    "params": {
      "maxLength": 500,
      "minLength": 100,
      "wordLimit": 200,
      "rubric": {
        "criteria": [
          {
            "name": "Concept Understanding",
            "maxScore": 4,
            "description": "Clear explanation of OOP concepts"
          },
          {
            "name": "Examples",
            "maxScore": 3,
            "description": "Relevant examples provided"
          },
          {
            "name": "Clarity",
            "maxScore": 3,
            "description": "Well-structured and clear response"
          }
        ]
      }
    },
    "options": []
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "title": "What is inheritance in OOP?",
    "type": "mcq",
    "marks": 5,
    "level": "easy",
    "options": [
      {
        "id": "opt-1",
        "text": "A mechanism that allows a class to inherit properties from another class",
        "isCorrect": true,
        "position": 1
      },
      {
        "id": "opt-2",
        "text": "A way to create multiple instances of a class",
        "isCorrect": false,
        "position": 2
      }
    ]
  }
]
```

### Submit Answer
```json
POST /attempts/{attemptId}/answers
Request:
{
  "questionId": "550e8400-e29b-41d4-a716-446655440001",
  "answer": {
    "text": "Object-oriented programming (OOP) is a programming paradigm that organizes code into objects that contain both data and code. The main principles include encapsulation, inheritance, and polymorphism. Encapsulation bundles data and methods that operate on that data within a single unit. Inheritance allows classes to inherit properties and methods from other classes, promoting code reuse. Polymorphism enables objects to be treated as instances of their parent class while maintaining their own unique implementations."
  },
  "timeSpent": 120
}

Response:
{
  "message": "Answer submitted successfully"
}
```

### Submit Attempt
```json
POST /attempts/{attemptId}/submit
Response:
{
  "attemptId": "550e8400-e29b-41d4-a716-446655440000",
  "score": null,
  "reviewStatus": "P",
  "result": null
}
```

### Get Pending Reviews
```json
GET /attempts/reviews/pending
Response:
[
  {
    "attemptId": "550e8400-e29b-41d4-a716-446655440000",
    "testId": "test-123",
    "userId": "user-456",
    "submittedAt": "2024-01-15T10:30:00Z",
    "answers": [
      {
        "questionId": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Explain the concept of object-oriented programming",
        "type": "subjective",
        "answer": "Object-oriented programming (OOP) is a programming paradigm..."
      }
    ]
  }
]
```

### Review Attempt
```json
POST /attempts/{attemptId}/review
Request:
{
  "answers": [
    {
      "questionId": "550e8400-e29b-41d4-a716-446655440001",
      "score": 8.5,
      "remarks": "Good understanding of OOP concepts with relevant examples. Could improve on polymorphism explanation."
    }
  ],
  "overallRemarks": "Overall good performance. Student demonstrates solid understanding of core concepts."
}

Response:
{
  "attemptId": "550e8400-e29b-41d4-a716-446655440000",
  "score": 85.0,
  "result": "P"
}
```

## 🎯 Questions

### Create Subjective Question
```json
POST /questions
Request:
{
  "title": "Explain the benefits of using TypeScript over JavaScript",
  "type": "subjective",
  "level": "medium",
  "marks": 15,
  "gradingType": "exercise",
  "params": {
    "maxLength": 800,
    "minLength": 200,
    "wordLimit": 300,
    "allowAttachments": false,
    "rubric": {
      "criteria": [
        {
          "name": "Technical Accuracy",
          "maxScore": 5,
          "description": "Correct technical information about TypeScript"
        },
        {
          "name": "Benefits Coverage",
          "maxScore": 5,
          "description": "Comprehensive coverage of TypeScript benefits"
        },
        {
          "name": "Examples",
          "maxScore": 3,
          "description": "Practical examples provided"
        },
        {
          "name": "Clarity",
          "maxScore": 2,
          "description": "Clear and well-structured response"
        }
      ]
    }
  }
}

Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "title": "Explain the benefits of using TypeScript over JavaScript",
  "type": "subjective",
  "level": "medium",
  "marks": 15,
  "gradingType": "exercise",
  "params": {
    "maxLength": 800,
    "minLength": 200,
    "wordLimit": 300,
    "allowAttachments": false,
    "rubric": {
      "criteria": [
        {
          "name": "Technical Accuracy",
          "maxScore": 5,
          "description": "Correct technical information about TypeScript"
        },
        {
          "name": "Benefits Coverage",
          "maxScore": 5,
          "description": "Comprehensive coverage of TypeScript benefits"
        },
        {
          "name": "Examples",
          "maxScore": 3,
          "description": "Practical examples provided"
        },
        {
          "name": "Clarity",
          "maxScore": 2,
          "description": "Clear and well-structured response"
        }
      ]
    }
  }
}
```

### Create Essay Question
```json
POST /questions
Request:
{
  "title": "Write a comprehensive essay on the impact of artificial intelligence on modern software development",
  "type": "essay",
  "level": "hard",
  "marks": 25,
  "gradingType": "exercise",
  "params": {
    "maxLength": 2000,
    "minLength": 500,
    "wordLimit": 800,
    "allowAttachments": true,
    "rubric": {
      "criteria": [
        {
          "name": "Introduction",
          "maxScore": 3,
          "description": "Clear introduction and thesis statement"
        },
        {
          "name": "Content Depth",
          "maxScore": 8,
          "description": "In-depth analysis of AI impact"
        },
        {
          "name": "Examples",
          "maxScore": 5,
          "description": "Relevant real-world examples"
        },
        {
          "name": "Critical Thinking",
          "maxScore": 4,
          "description": "Critical analysis and balanced perspective"
        },
        {
          "name": "Conclusion",
          "maxScore": 3,
          "description": "Strong conclusion with future implications"
        },
        {
          "name": "Writing Quality",
          "maxScore": 2,
          "description": "Clear, coherent writing style"
        }
      ]
    }
  }
}
```

## 🎯 Answer Validation Examples

### MCQ Answer
```json
{
  "questionId": "550e8400-e29b-41d4-a716-446655440002",
  "answer": {
    "selectedOptionIds": ["opt-1"]
  }
}
```

### Multiple Answer
```json
{
  "questionId": "550e8400-e29b-41d4-a716-446655440003",
  "answer": {
    "selectedOptionIds": ["opt-1", "opt-3", "opt-5"]
  }
}
```

### Fill in the Blank
```json
{
  "questionId": "550e8400-e29b-41d4-a716-446655440004",
  "answer": {
    "blanks": ["encapsulation", "inheritance", "polymorphism"]
  }
}
```

### Matching
```json
{
  "questionId": "550e8400-e29b-41d4-a716-446655440005",
  "answer": {
    "matches": ["A-1", "B-3", "C-2", "D-4"]
  }
}
```

### Subjective/Essay
```json
{
  "questionId": "550e8400-e29b-41d4-a716-446655440006",
  "answer": {
    "text": "TypeScript provides several key benefits over JavaScript including static typing, enhanced IDE support, better error detection at compile time, and improved code maintainability. Static typing helps catch errors early in development, while enhanced IDE support provides better autocomplete and refactoring capabilities..."
  }
}
``` 
