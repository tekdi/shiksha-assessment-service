# Conditional Questions Feature Design

## Overview

This document outlines the **backend API design** for implementing conditional questions in the assessment system, where question options can trigger the display of child questions, creating nested conditional logic up to N levels deep. This design focuses exclusively on backend changes including database schema updates, API modifications, and service logic enhancements.

## Table of Contents

1. [Database Design Changes](#database-design-changes)
2. [API Changes](#api-changes)
3. [Backend Code Changes](#backend-code-changes)
4. [Example JSON Structures](#example-json-structures)
5. [Benefits of the Design](#benefits-of-the-design)
6. [Implementation Timeline](#implementation-timeline)

---

## Database Design Changes

### 1. Enhanced Question Entity

The existing `questions` table needs minimal changes to support conditional questions:

```sql
-- Add new column to existing questions table
ALTER TABLE questions ADD COLUMN parentId UUID NULL;

-- Add foreign key constraint (self-referencing)
ALTER TABLE questions ADD CONSTRAINT fk_questions_parent 
FOREIGN KEY (parentId) REFERENCES questions(questionId) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_questions_parent ON questions(parentId);
```

### 2. Question Options Table

The existing `questionOptions` table remains unchanged - no modifications needed.

### 3. New Option Questions Relationship Table

Create a new table to store the relationship between options and their conditional questions:

```sql
CREATE TABLE optionQuestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenantId UUID NOT NULL,
    organisationId UUID NOT NULL,
    optionId UUID NOT NULL,
    questionId UUID NOT NULL,
    ordering INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_option_questions_option 
        FOREIGN KEY (optionId) REFERENCES questionOptions(questionOptionId) ON DELETE CASCADE,
    CONSTRAINT fk_option_questions_question 
        FOREIGN KEY (questionId) REFERENCES questions(questionId) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate relationships
    CONSTRAINT uk_option_question UNIQUE (optionId, questionId)
);

-- Indexes
CREATE INDEX idx_option_questions_tenant ON optionQuestions(tenantId, organisationId);
CREATE INDEX idx_option_questions_option ON optionQuestions(optionId);
CREATE INDEX idx_option_questions_question ON optionQuestions(questionId);
```

### 4. Enhanced Test Questions Table

The existing `testQuestions` table gets one additional column to support conditional questions:

```sql
-- Add new column to existing testQuestions table
ALTER TABLE testQuestions ADD COLUMN isConditional BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX idx_test_questions_conditional ON testQuestions(isConditional);
```

---

## API Changes

### 1. Enhanced Create Question API

**Endpoint:** `POST /assessment/v1/questions`

**Request Body Enhancement:**

```json
{
  "text": "What do you like about the company?",
  "type": "mcq",
  "options": [
    {
      "text": "Infrastructure",
      "isCorrect": true,
      "hasChildQuestion": true,
      "childQuestion": {
        "text": "What do you like about infrastructure?",
        "type": "mcq",
        "options": [
          {
            "text": "Server Performance",
            "isCorrect": true
          },
          {
            "text": "Network Speed",
            "isCorrect": false
          }
        ]
      }
    },
    {
      "text": "Environment",
      "isCorrect": false,
      "hasChildQuestion": true,
      "childQuestion": {
        "text": "Rate us on environment (1-5)",
        "type": "mcq",
        "options": [
          {
            "text": "1",
            "isCorrect": false,
            "hasChildQuestion": true,
            "childQuestion": {
              "text": "What do you most like?",
              "type": "subjective"
            }
          },
          {
            "text": "2",
            "isCorrect": false,
            "hasChildQuestion": true,
            "childQuestion": {
              "text": "What do you most like?",
              "type": "subjective"
            }
          },
          {
            "text": "3",
            "isCorrect": false,
            "hasChildQuestion": true,
            "childQuestion": {
              "text": "What do you most like?",
              "type": "subjective"
            }
          },
          {
            "text": "4",
            "isCorrect": true
          },
          {
            "text": "5",
            "isCorrect": true
          }
        ]
      }
    }
  ]
}
```

### 2. Enhanced Fetch Questions API

**Endpoint:** `GET /assessment/v1/questions/{questionId}/hierarchy`

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "questionId": "q1-123",
    "text": "What do you like about the company?",
    "type": "mcq",
    "parentId": null,
    "options": [
      {
        "questionOptionId": "opt1-123",
        "text": "Infrastructure",
        "isCorrect": true,
        "hasChildQuestion": true,
        "childQuestion": {
          "questionId": "q2-456",
          "text": "What do you like about infrastructure?",
          "type": "mcq",
          "parentId": "q1-123",
          "options": [
            {
              "questionOptionId": "opt2-789",
              "text": "Server Performance",
              "isCorrect": true,
              "hasChildQuestion": false
            },
            {
              "questionOptionId": "opt2-790",
              "text": "Network Speed",
              "isCorrect": false,
              "hasChildQuestion": false
            }
          ]
        }
      },
      {
        "questionOptionId": "opt1-124",
        "text": "Environment",
        "isCorrect": false,
        "hasChildQuestion": true,
        "childQuestion": {
          "questionId": "q3-457",
          "text": "Rate us on environment (1-5)",
          "type": "mcq",
          "parentId": "q1-123",
          "options": [
            {
              "questionOptionId": "opt3-791",
              "text": "1",
              "isCorrect": false,
              "hasChildQuestion": true,
              "childQuestion": {
                "questionId": "q4-458",
                "text": "What do you most like?",
                "type": "subjective",
                "parentId": "q3-457"
              }
            },
            {
              "questionOptionId": "opt3-792",
              "text": "2",
              "isCorrect": false,
              "hasChildQuestion": true,
              "childQuestion": {
                "questionId": "q5-459",
                "text": "What do you most like?",
                "type": "subjective",
                "parentId": "q3-457"
              }
            },
            {
              "questionOptionId": "opt3-793",
              "text": "3",
              "isCorrect": false,
              "hasChildQuestion": true,
              "childQuestion": {
                "questionId": "q6-460",
                "text": "What do you most like?",
                "type": "subjective",
                "parentId": "q3-457"
              }
            },
            {
              "questionOptionId": "opt3-794",
              "text": "4",
              "isCorrect": true,
              "hasChildQuestion": false
            },
            {
              "questionOptionId": "opt3-795",
              "text": "5",
              "isCorrect": true,
              "hasChildQuestion": false
            }
          ]
        }
      }
    ]
  }
}
```

### 3. Enhanced Submit Response API

**Endpoint:** `POST /assessment/v1/attempts/{attemptId}/answers`

**Request Body (No Changes Required):**

The existing submit answer API remains unchanged. Conditional questions are treated as separate questions and answered individually:

```json
{
  "answers": [
    {
      "questionId": "q1-123",
      "answer": {
        "selectedOptionIds": ["opt1-123"]
      }
    },
    {
      "questionId": "q2-456",
      "answer": {
        "selectedOptionIds": ["opt2-789"]
      }
    },
    {
      "questionId": "q3-457",
      "answer": {
        "selectedOptionIds": ["opt3-791"]
      }
    },
    {
      "questionId": "q4-458",
      "answer": {
        "text": "I like the collaborative environment"
      }
    }
  ],
  "timeSpent": 120
}
```

**Note:** Since we're not modifying the `testUserAnswers` table, conditional questions are treated as regular questions. The frontend will handle the conditional logic and submit answers for all visible questions.

---

## Backend Code Changes

### 1. Entity Updates

**Enhanced Question Entity:**

```typescript
// src/modules/questions/entities/question.entity.ts
@Entity('questions')
export class Question {
  // ... existing properties ...

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  // Relations
  @OneToMany(() => QuestionOption, option => option.question)
  options: QuestionOption[];

  @ManyToOne(() => Question, question => question.childQuestions)
  @JoinColumn({ name: 'parentId' })
  parent: Question;

  @OneToMany(() => Question, question => question.parent)
  childQuestions: Question[];

  @OneToMany(() => OptionQuestion, optionQuestion => optionQuestion.question)
  optionQuestions: OptionQuestion[];
}
```

**Question Option Entity (No Changes):**

```typescript
// src/modules/questions/entities/question-option.entity.ts
@Entity('questionOptions')
export class QuestionOption {
  // ... existing properties remain unchanged ...

  // Relations
  @OneToMany(() => OptionQuestion, optionQuestion => optionQuestion.option)
  optionQuestions: OptionQuestion[];
}
```

**New Option Question Relationship Entity:**

```typescript
// src/modules/questions/entities/option-question.entity.ts
@Entity('optionQuestions')
export class OptionQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'uuid' })
  optionId: string;

  @Column({ type: 'uuid' })
  questionId: string;

  @Column({ type: 'integer', default: 0 })
  ordering: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => QuestionOption, option => option.optionQuestions)
  @JoinColumn({ name: 'optionId' })
  option: QuestionOption;

  @ManyToOne(() => Question, question => question.optionQuestions)
  @JoinColumn({ name: 'questionId' })
  question: Question;
}
```

**Enhanced Test Question Entity:**

```typescript
// src/modules/tests/entities/test-question.entity.ts
@Entity('testQuestions')
export class TestQuestion {
  // ... existing properties ...

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  isConditional: boolean;

  // Relations remain unchanged
}
```

### 2. Service Logic Updates

**Enhanced Questions Service:**

```typescript
// src/modules/questions/questions.service.ts
export class QuestionsService {
  // ... existing methods ...

  async createWithConditionals(createQuestionDto: CreateQuestionDto, authContext: AuthContext): Promise<Question> {
    const question = await this.create(createQuestionDto, authContext);
    
    if (createQuestionDto.options) {
      for (const optionDto of createQuestionDto.options) {
        if (optionDto.hasChildQuestion && optionDto.childQuestion) {
          await this.createChildQuestion(question.questionId, optionDto, authContext);
        }
      }
    }
    
    return question;
  }

  private async createChildQuestion(parentQuestionId: string, parentOption: CreateQuestionOptionDto, authContext: AuthContext): Promise<Question> {
    const childQuestionDto = {
      ...parentOption.childQuestion,
      parentId: parentQuestionId
    };

    const childQuestion = await this.create(childQuestionDto, authContext);
    
    // Create relationship between option and child question
    await this.createOptionQuestionRelationship(parentOption.questionOptionId, childQuestion.questionId, authContext);
    
    return childQuestion;
  }

  private async createOptionQuestionRelationship(optionId: string, questionId: string, authContext: AuthContext): Promise<OptionQuestion> {
    const optionQuestion = new OptionQuestion();
    optionQuestion.optionId = optionId;
    optionQuestion.questionId = questionId;
    optionQuestion.tenantId = authContext.tenantId;
    optionQuestion.organisationId = authContext.organisationId;
    
    return this.optionQuestionRepository.save(optionQuestion);
  }

  async getQuestionHierarchy(questionId: string, authContext: AuthContext): Promise<Question> {
    return this.questionRepository.findOne({
      where: { questionId, tenantId: authContext.tenantId },
      relations: [
        'options', 
        'options.optionQuestions', 
        'options.optionQuestions.question',
        'options.optionQuestions.question.options',
        'options.optionQuestions.question.options.optionQuestions',
        'options.optionQuestions.question.options.optionQuestions.question'
      ],
      order: {
        options: { ordering: 'ASC' },
        'options.optionQuestions': { ordering: 'ASC' }
      }
    });
  }

  async getConditionalQuestionsForOption(optionId: string, authContext: AuthContext): Promise<Question[]> {
    const optionQuestions = await this.optionQuestionRepository.find({
      where: { 
        optionId,
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId,
        isActive: true
      },
      relations: ['question', 'question.options'],
      order: { ordering: 'ASC' }
    });

    return optionQuestions.map(oq => oq.question);
  }

  async getConditionalQuestionsForTest(testId: string, authContext: AuthContext): Promise<Question[]> {
    return this.questionRepository.find({
      where: { 
        parentId: IsNotNull(),
        tenantId: authContext.tenantId,
        organisationId: authContext.organisationId
      },
      relations: ['parent', 'options'],
      order: { ordering: 'ASC' }
    });
  }
}
```

**Enhanced Tests Service:**

```typescript
// src/modules/tests/tests.service.ts
export class TestsService {
  // ... existing methods ...

  async getTestWithConditionalQuestions(testId: string, authContext: AuthContext): Promise<any> {
    const test = await this.findOne(testId, authContext);
    
    // Get all questions for the test (including conditional ones)
    const testQuestions = await this.testQuestionRepository.find({
      where: { testId, tenantId: authContext.tenantId },
      relations: ['question', 'question.options', 'question.options.optionQuestions', 'question.options.optionQuestions.question'],
      order: { ordering: 'ASC' }
    });

    // Separate root questions from conditional questions
    const rootQuestions = testQuestions.filter(tq => !tq.question.parentId);
    const conditionalQuestions = testQuestions.filter(tq => tq.question.parentId);

    return {
      ...test,
      questions: rootQuestions,
      conditionalQuestions: conditionalQuestions
    };
  }

  async addConditionalQuestionToTest(testId: string, questionId: string, authContext: AuthContext): Promise<void> {
    const testQuestion = new TestQuestion();
    testQuestion.testId = testId;
    testQuestion.questionId = questionId;
    testQuestion.isConditional = true;
    testQuestion.tenantId = authContext.tenantId;
    testQuestion.organisationId = authContext.organisationId;
    
    await this.testQuestionRepository.save(testQuestion);
  }
}
```

### 3. Enhanced DTOs

**Enhanced Create Question DTO:**

```typescript
// src/modules/questions/dto/create-question.dto.ts
export class CreateQuestionOptionDto {
  // ... existing properties ...

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasChildQuestion?: boolean;

  @ApiPropertyOptional({
    description: 'Child question to be created when this option is selected',
    type: 'object'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuestionDto)
  childQuestion?: CreateQuestionDto;
}

export class CreateQuestionDto {
  // ... existing properties ...

  @ApiPropertyOptional({
    description: 'ID of the parent question (for conditional questions)',
    example: 'q-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
```

**Enhanced Test Question DTO:**

```typescript
// src/modules/tests/dto/add-question-to-test.dto.ts
export class AddQuestionToTestDto {
  // ... existing properties ...

  @ApiPropertyOptional({
    description: 'Whether this is a conditional question',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  isConditional?: boolean;
}
```

---

## Example JSON Structures

### Complete Hierarchy API Response

**Endpoint:** `GET /assessment/v1/questions/{questionId}/hierarchy`

This response demonstrates the complete hierarchy for your example use case with the simplified database design using `parentId` and `optionQuestions` relationships.

```json
{
  "success": true,
  "message": "Question hierarchy retrieved successfully",
  "data": {
    "questionId": "q1-123e4567-e89b-12d3-a456-426614174000",
    "text": "What do you like about the company?",
    "type": "mcq",
    "level": "medium",
    "marks": 5,
    "parentId": null,
    "status": "published",
    "options": [
      {
        "questionOptionId": "opt1-123e4567-e89b-12d3-a456-426614174001",
        "text": "Infrastructure",
        "isCorrect": true,
        "marks": 2.5,
        "ordering": 1,
        "childQuestion": {
          "questionId": "q2-123e4567-e89b-12d3-a456-426614174002",
          "text": "What do you like about infrastructure?",
          "type": "mcq",
          "level": "easy",
          "marks": 3,
          "parentId": "q1-123e4567-e89b-12d3-a456-426614174000",
          "status": "published",
          "options": [
            {
              "questionOptionId": "opt2-123e4567-e89b-12d3-a456-426614174003",
              "text": "Server Performance",
              "isCorrect": true,
              "marks": 1.5,
              "ordering": 1
            },
            {
              "questionOptionId": "opt2-123e4567-e89b-12d3-a456-426614174004",
              "text": "Network Speed",
              "isCorrect": false,
              "marks": 0,
              "ordering": 2
            },
            {
              "questionOptionId": "opt2-123e4567-e89b-12d3-a456-426614174005",
              "text": "Storage Capacity",
              "isCorrect": false,
              "marks": 0,
              "ordering": 3
            }
          ]
        }
      },
      {
        "questionOptionId": "opt1-123e4567-e89b-12d3-a456-426614174006",
        "text": "Environment",
        "isCorrect": false,
        "marks": 0,
        "ordering": 2,
        "childQuestion": {
          "questionId": "q3-123e4567-e89b-12d3-a456-426614174007",
          "text": "Rate us on environment (1-5)",
          "type": "mcq",
          "level": "medium",
          "marks": 4,
          "parentId": "q1-123e4567-e89b-12d3-a456-426614174000",
          "status": "published",
          "options": [
            {
              "questionOptionId": "opt3-123e4567-e89b-12d3-a456-426614174008",
              "text": "1",
              "isCorrect": false,
              "marks": 0,
              "ordering": 1,
              "childQuestion": {
                "questionId": "q4-123e4567-e89b-12d3-a456-426614174009",
                "text": "What do you most like about our environment?",
                "type": "subjective",
                "level": "easy",
                "marks": 2,
                "parentId": "q3-123e4567-e89b-12d3-a456-426614174007",
                "status": "published",
                "params": {
                  "maxLength": 500,
                  "minLength": 10
                }
              }
            },
            {
              "questionOptionId": "opt3-123e4567-e89b-12d3-a456-426614174010",
              "text": "2",
              "isCorrect": false,
              "marks": 0,
              "ordering": 2,
              "childQuestion": {
                "questionId": "q5-123e4567-e89b-12d3-a456-426614174011",
                "text": "What do you most like about our environment?",
                "type": "subjective",
                "level": "easy",
                "marks": 2,
                "parentId": "q3-123e4567-e89b-12d3-a456-426614174007",
                "status": "published",
                "params": {
                  "maxLength": 500,
                  "minLength": 10
                }
              }
            },
            {
              "questionOptionId": "opt3-123e4567-e89b-12d3-a456-426614174012",
              "text": "3",
              "isCorrect": false,
              "marks": 0,
              "ordering": 3,
              "childQuestion": {
                "questionId": "q6-123e4567-e89b-12d3-a456-426614174013",
                "text": "What do you most like about our environment?",
                "type": "subjective",
                "level": "easy",
                "marks": 2,
                "parentId": "q3-123e4567-e89b-12d3-a456-426614174007",
                "status": "published",
                "params": {
                  "maxLength": 500,
                  "minLength": 10
                }
              }
            },
            {
              "questionOptionId": "opt3-123e4567-e89b-12d3-a456-426614174014",
              "text": "4",
              "isCorrect": true,
              "marks": 2,
              "ordering": 4
            },
            {
              "questionOptionId": "opt3-123e4567-e89b-12d3-a456-426614174015",
              "text": "5",
              "isCorrect": true,
              "marks": 2,
              "ordering": 5
            }
          ]
        }
      },
      {
        "questionOptionId": "opt1-123e4567-e89b-12d3-a456-426614174016",
        "text": "Employees",
        "isCorrect": false,
        "marks": 0,
        "ordering": 3,
        "childQuestion": {
          "questionId": "q7-123e4567-e89b-12d3-a456-426614174017",
          "text": "What do you like about our employees?",
          "type": "multiple_answer",
          "level": "medium",
          "marks": 3,
          "parentId": "q1-123e4567-e89b-12d3-a456-426614174000",
          "status": "published",
          "options": [
            {
              "questionOptionId": "opt4-123e4567-e89b-12d3-a456-426614174018",
              "text": "Friendly",
              "isCorrect": true,
              "marks": 1,
              "ordering": 1
            },
            {
              "questionOptionId": "opt4-123e4567-e89b-12d3-a456-426614174019",
              "text": "Knowledgeable",
              "isCorrect": true,
              "marks": 1,
              "ordering": 2
            },
            {
              "questionOptionId": "opt4-123e4567-e89b-12d3-a456-426614174020",
              "text": "Supportive",
              "isCorrect": true,
              "marks": 1,
              "ordering": 3
            },
            {
              "questionOptionId": "opt4-123e4567-e89b-12d3-a456-426614174021",
              "text": "None of the above",
              "isCorrect": false,
              "marks": 0,
              "ordering": 4
            }
          ]
        }
      },
      {
        "questionOptionId": "opt1-123e4567-e89b-12d3-a456-426614174022",
        "text": "Work Culture",
        "isCorrect": false,
        "marks": 0,
        "ordering": 4
      }
    ],
    "media": {
      "image": "https://cdn.example.com/company-feedback.png"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### Key Features Demonstrated

#### 1. **Parent-Child Hierarchy**
- Root question has `parentId: null`
- Child questions have `parentId` pointing to their parent
- Supports infinite nesting levels

#### 2. **Option-Question Relationships**
- Presence of `childQuestion` object indicates an option triggers conditional questions
- `childQuestion` object contains the conditional question
- Multiple levels of nesting supported
- Relationships are managed through the `optionQuestions` table

#### 3. **Question Types Supported**
- **MCQ**: Single choice questions
- **Multiple Answer**: Multiple choice questions
- **Subjective**: Text-based answers with parameters

#### 4. **Complete Question Metadata**
- Question properties: `text`, `type`, `level`, `marks`, `status`
- Option properties: `text`, `isCorrect`, `marks`, `ordering`
- Media support for questions
- Timestamps for audit trail

#### 5. **Conditional Logic Flow**
```
Root Question: "What do you like about the company?"
├── Option: "Infrastructure" → Child Question: "What do you like about infrastructure?"
├── Option: "Environment" → Child Question: "Rate us on environment (1-5)"
│   ├── Option: "1" → Child Question: "What do you most like about our environment?"
│   ├── Option: "2" → Child Question: "What do you most like about our environment?"
│   ├── Option: "3" → Child Question: "What do you most like about our environment?"
│   ├── Option: "4" → No child question
│   └── Option: "5" → No child question
├── Option: "Employees" → Child Question: "What do you like about our employees?"
└── Option: "Work Culture" → No child question
```

#### 6. **Database Relationships**
```sql
-- Questions Table Structure
-- Root question
questionId: q1-123..., parentId: NULL

-- First level conditional questions
questionId: q2-123..., parentId: q1-123...
questionId: q3-123..., parentId: q1-123...
questionId: q7-123..., parentId: q1-123...

-- Second level conditional questions
questionId: q4-123..., parentId: q3-123...
questionId: q5-123..., parentId: q3-123...
questionId: q6-123..., parentId: q3-123...

-- Option Questions Table Structure
-- Infrastructure option triggers infrastructure question
optionId: opt1-123..., questionId: q2-123...

-- Environment option triggers environment rating question
optionId: opt1-123..., questionId: q3-123...

-- Rating options trigger follow-up questions
optionId: opt3-123..., questionId: q4-123...
optionId: opt3-123..., questionId: q5-123...
optionId: opt3-123..., questionId: q6-123...

-- Employees option triggers employees question
optionId: opt1-123..., questionId: q7-123...
```

### Submit Response API Request (Simple Structure)

```json
{
  "answers": [
    {
      "questionId": "q1-123",
      "answer": {
        "selectedOptionIds": ["opt1-123"]
      }
    },
    {
      "questionId": "q2-456",
      "answer": {
        "selectedOptionIds": ["opt2-789"]
      }
    },
    {
      "questionId": "q3-457",
      "answer": {
        "selectedOptionIds": ["opt3-791"]
      }
    },
    {
      "questionId": "q4-458",
      "answer": {
        "text": "I like the collaborative environment"
      }
    }
  ],
  "timeSpent": 120
}
```

---

## Benefits of the Design

### 1. **Minimal Database Changes**
- Only 1 new column in `questions` table (`parentId`)
- Only 1 new column in `testQuestions` table (`isConditional`)
- Only 1 new table (`optionQuestions`) for relationships
- No changes to existing `questionOptions` or `testUserAnswers` tables

### 2. **Simple Parent-Child Structure**
- Self-referencing `parentId` creates clear question hierarchy
- Easy to understand and maintain
- Supports infinite nesting levels naturally

### 3. **Flexible Option-Question Relationships**
- `optionQuestions` table allows multiple options to trigger the same question
- Multiple conditional questions can be triggered by one option
- Easy to add/remove conditional relationships without schema changes

### 4. **Leverages Existing Infrastructure**
- Uses existing `testQuestions` table for test-question relationships
- Maintains existing answer storage in `testUserAnswers`
- No complex conditional logic tables needed

### 5. **Performance Optimized**
- Simple indexes on `parentId` and `optionId`
- Efficient recursive queries possible
- No complex joins required for basic operations

### 6. **Backward Compatibility**
- Existing questions continue to work without modification
- New fields have sensible defaults (NULL for `parentId`, false for `isConditional`)
- Gradual migration path for existing data

### 7. **Clean API Design**
- No changes to existing submit answer API
- Conditional questions treated as regular questions
- Frontend handles conditional logic and visibility

### 8. **Data Integrity**
- Foreign key constraints maintain referential integrity
- Cascade deletes prevent orphaned records
- Unique constraints prevent duplicate option-question relationships

---

## Implementation Timeline

### Phase 1: Database Schema Updates (Week 1-2)
- [ ] Create database migration scripts
- [ ] Update entity definitions
- [ ] Add new indexes and constraints
- [ ] Test migration on development environment

### Phase 2: Backend API Development (Week 3-4)
- [ ] Enhance question creation API with conditional support
- [ ] Implement hierarchy fetching logic using parentId relationships
- [ ] Add conditional question service methods for option-question relationships
- [ ] Update DTOs with parentId field
- [ ] Create OptionQuestion entity and repository
- [ ] Write unit tests for new functionality

### Phase 3: Integration & Testing (Week 5-6)
- [ ] End-to-end API testing
- [ ] Performance optimization for recursive queries
- [ ] Security review of new endpoints
- [ ] API documentation updates
- [ ] Load testing with nested questions

### Phase 4: Deployment & Monitoring (Week 7-8)
- [ ] Production deployment
- [ ] Monitor API performance metrics
- [ ] Collect feedback from API consumers
- [ ] Bug fixes and improvements
- [ ] API documentation finalization

---

This design provides a robust foundation for implementing conditional questions while maintaining the existing system's performance and reliability. The recursive structure allows for complex nested scenarios while keeping the implementation clean and maintainable.