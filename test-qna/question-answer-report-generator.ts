// question-answer-report-generator.ts
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface TestQuestion {
  testQuestionId: string;
  questionId: string;
  sectionId?: string;
  sectionOrdering: number;
  questionOrdering: number;
  questionText: string;
  questionType: string;
  questionMarks: number;
}

interface QuestionOption {
  questionOptionId: string;
  questionId: string;
  text: string;
  ordering: number;
  isCorrect: boolean;
  marks: number;
}

interface UserAnswer {
  userId: string;
  attemptId: string;
  attemptNumber: number;
  questionId: string;
  questionOrder: number;
  answerText: string;
  score: number;
  maxScore: number;
  status: string;
  startTime: Date;
  submitTime?: Date;
  timeSpent: number;
  totalScore: number;
}

interface QuestionAnswerReport {
  questionId: string;
  questionText: string;
  questionType: string;
  ordering: number;
  marks: number;
  options: QuestionOption[];
}

class QuestionAnswerReportGenerator {
  private client: Client;
  private testId: string;

  constructor(testId: string) {
    this.testId = testId;
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5434'),
      database: process.env.DB_DATABASE || 'assessment_db',
      user: process.env.DB_USERNAME || 'aspire',
      password: process.env.DB_PASSWORD || '55VB9UbhW8AO',
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to database successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('🔌 Disconnected from database');
  }

  /**
   * Step 1: Get all questions for the test with proper ordering (sections first, then questions)
   */
  async getTestQuestions(): Promise<TestQuestion[]> {
    console.log('📋 Step 1: Getting test questions with section and question ordering...');
    
    const query = `
      SELECT 
        tq."testQuestionId",
        tq."questionId",
        tq."sectionId",
        COALESCE(ts."ordering", 0) as "sectionOrdering",
        tq."ordering" as "questionOrdering",
        q."text" as "questionText",
        q."type" as "questionType",
        q."marks" as "questionMarks"
      FROM "testQuestions" tq
      INNER JOIN questions q ON tq."questionId" = q."questionId"
      LEFT JOIN "testSections" ts ON tq."sectionId" = ts."sectionId"
      WHERE tq."testId" = $1
      ORDER BY COALESCE(ts."ordering", 0) ASC, tq."ordering" ASC
    `;

    const result = await this.client.query(query, [this.testId]);
    const questions = result.rows;
    
    console.log(`📝 Found ${questions.length} questions for test`);
    
    // Log the ordering for verification
    questions.forEach((q, index) => {
      console.log(`  ${index + 1}. Section ${q.sectionOrdering}, Question ${q.questionOrdering}: ${q.questionText.substring(0, 50)}...`);
    });
    
    return questions;
  }

  /**
   * Step 2: Get question options for objective questions
   */
  async getQuestionOptions(questionIds: string[]): Promise<Map<string, QuestionOption[]>> {
    console.log('🔍 Step 2: Getting question options...');
    
    if (questionIds.length === 0) {
      return new Map();
    }

    const query = `
      SELECT 
        "questionOptionId",
        "questionId",
        "text",
        "ordering",
        "isCorrect",
        "marks"
      FROM "questionOptions"
      WHERE "questionId" = ANY($1)
      ORDER BY "questionId", "ordering" ASC
    `;

    const result = await this.client.query(query, [questionIds]);
    const optionsMap = new Map<string, QuestionOption[]>();
    
    result.rows.forEach((option: QuestionOption) => {
      if (!optionsMap.has(option.questionId)) {
        optionsMap.set(option.questionId, []);
      }
      optionsMap.get(option.questionId)!.push(option);
    });

    console.log(`🔍 Found options for ${optionsMap.size} questions`);
    return optionsMap;
  }

  /**
   * Step 3: Get user answers for the test
   */
  async getUserAnswers(): Promise<UserAnswer[]> {
    console.log('👥 Step 3: Getting user answers...');
    
    const query = `
      SELECT DISTINCT
        ta."userId",
        ta."attemptId",
        ta."attempt" as "attemptNumber",
        tua."questionId",
        tq."ordering" as "questionOrdering",
        COALESCE(ts."ordering", 0) as "sectionOrdering",
        tua."answer" as "answerText",
        tua."score",
        q."marks" as "maxScore",
        ta."status",
        ta."startedAt" as "startTime",
        ta."submittedAt" as "submitTime",
        COALESCE(ta."timeSpent", 0) as "timeSpent",
        ta."score" as "totalScore"
      FROM "testUserAnswers" tua
      INNER JOIN "testAttempts" ta ON tua."attemptId" = ta."attemptId"
      INNER JOIN "testQuestions" tq ON tua."questionId" = tq."questionId" AND tq."testId" = $1
      INNER JOIN questions q ON tua."questionId" = q."questionId"
      LEFT JOIN "testSections" ts ON tq."sectionId" = ts."sectionId"
      WHERE ta."testId" = $1
      ORDER BY ta."userId", COALESCE(ts."ordering", 0) ASC, tq."ordering" ASC
    `;

    const result = await this.client.query(query, [this.testId]);
    const answers = result.rows;
    
    console.log(`👥 Found ${answers.length} answers from ${new Set(answers.map(a => a.userId)).size} users`);
    return answers;
  }

  /**
   * Step 4: Process answers to extract proper option text or text
   */
  processAnswers(
    answers: UserAnswer[], 
    questions: TestQuestion[], 
    optionsMap: Map<string, QuestionOption[]>
  ): Map<string, Map<string, string>> {
    console.log('🔄 Step 4: Processing answers...');
    
    const userAnswersMap = new Map<string, Map<string, string>>();
    
    answers.forEach(answer => {
      if (!userAnswersMap.has(answer.userId)) {
        userAnswersMap.set(answer.userId, new Map());
      }
      
      const userAnswerMap = userAnswersMap.get(answer.userId)!;
      const question = questions.find(q => q.questionId === answer.questionId);
      
      if (question) {
        let processedAnswer = '';
        
        try {
          // Parse the JSON answer
          const answerData = JSON.parse(answer.answerText);
          
          if (answerData.text) {
            // Subjective question with text
            processedAnswer = answerData.text;
          } else if (answerData.selectedOptionIds && Array.isArray(answerData.selectedOptionIds)) {
            // Objective question with selected option IDs
            const options = optionsMap.get(answer.questionId);
            if (options && answerData.selectedOptionIds.length > 0) {
              const selectedOptions = answerData.selectedOptionIds.map((optionId: string) => {
                const option = options.find(opt => opt.questionOptionId === optionId);
                return option ? option.text : optionId;
              });
              processedAnswer = selectedOptions.join('; ');
            } else {
              processedAnswer = answerData.selectedOptionIds.join('; ');
            }
          } else {
            // Fallback to original text
            processedAnswer = answer.answerText;
          }
        } catch (error) {
          // If JSON parsing fails, use original text
          processedAnswer = answer.answerText;
        }
        
        userAnswerMap.set(answer.questionId, processedAnswer);
      }
    });
    
    console.log(`🔄 Processed answers for ${userAnswersMap.size} users`);
    return userAnswersMap;
  }

  /**
   * Step 5: Generate CSV with question titles as headers
   */
  generateCSV(
    questions: TestQuestion[], 
    userAnswersMap: Map<string, Map<string, string>>,
    userInfo: Map<string, { attemptNumber: number; status: string; startTime: Date; submitTime?: Date; score: number; timeSpent: number }>
  ): string {
    console.log('📄 Step 5: Generating CSV...');
    
    // Create CSV header with question titles, IDs, types, and marks
    const headers = [
      'User ID',
      ...questions.map(q => `"${q.questionText} - (${q.questionId} - ${q.questionType} - ${q.questionMarks})"`),
      'Time Spent (minutes)',
      'Score'
    ];
    
    // Create CSV rows
    const rows: string[] = [];
    
    userAnswersMap.forEach((userAnswers, userId) => {
      const user = userInfo.get(userId);
      if (user) {
        const questionAnswers = questions.map(q => {
          const answer = userAnswers.get(q.questionId);
          return answer ? `"${answer.replace(/"/g, '""')}"` : '""';
        });
        
        const row = [
          userId,
          ...questionAnswers,
          Math.round(user.timeSpent / 60).toString(), // Convert seconds to minutes
          user.score.toString()
        ];
        
        console.log(`  Row for user ${userId}: ${row.length} columns (${questionAnswers.length} questions + 3 metadata)`);
        rows.push(row.join(','));
      }
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    console.log(`📄 Generated CSV with ${headers.length} columns and ${rows.length} rows`);
    console.log(`📄 Headers: ${headers.length} columns`);
    console.log(`📄 Sample row: ${rows[0] ? rows[0].split(',').length : 0} columns`);
    return csv;
  }

  /**
   * Main method to generate the report
   */
  async generateReport(): Promise<void> {
    try {
      console.log(`🚀 Starting Question-Answer Report Generation for Test: ${this.testId}`);
      
      // Step 1: Get test questions
      const questions = await this.getTestQuestions();
      if (questions.length === 0) {
        console.log('❌ No questions found for this test');
        return;
      }

      // Step 2: Get question options
      const questionIds = questions.map(q => q.questionId);
      const optionsMap = await this.getQuestionOptions(questionIds);

      // Step 3: Get user answers
      const answers = await this.getUserAnswers();
      if (answers.length === 0) {
        console.log('❌ No user answers found for this test');
        return;
      }

      // Step 4: Process answers
      const userAnswersMap = this.processAnswers(answers, questions, optionsMap);

      // Step 5: Prepare user info
      const userInfo = new Map<string, { attemptNumber: number; status: string; startTime: Date; submitTime?: Date; score: number; timeSpent: number }>();
      answers.forEach(answer => {
        if (!userInfo.has(answer.userId)) {
          userInfo.set(answer.userId, {
            attemptNumber: answer.attemptNumber,
            status: answer.status,
            startTime: answer.startTime,
            submitTime: answer.submitTime,
            score: answer.totalScore || 0,
            timeSpent: answer.timeSpent || 0
          });
        }
      });
      
      // Debug: Check userInfo data
      console.log(`🔍 UserInfo entries: ${userInfo.size}`);
      userInfo.forEach((user, userId) => {
        console.log(`  User ${userId}: score=${user.score}, timeSpent=${user.timeSpent}`);
      });

      // Step 6: Generate CSV
      const csv = this.generateCSV(questions, userAnswersMap, userInfo);

      // Step 7: Save CSV file
      const filename = `question-answer-report-${this.testId.substring(0, 8)}.csv`;
      fs.writeFileSync(filename, csv, 'utf8');
      
      console.log(`💾 Report saved to: ${path.resolve(filename)}`);
      console.log(`✅ Question-Answer report generation completed successfully!`);
      console.log(`📊 Generated report for ${userInfo.size} users with ${questions.length} questions`);
      console.log(`📋 Test Questions: ${questions.map(q => q.questionText.substring(0, 50)).join(', ')}`);
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const testId = process.argv[2];
  
  if (!testId) {
    console.log('Usage: ts-node question-answer-report-generator.ts <test-id>');
    console.log('Example: ts-node question-answer-report-generator.ts 1e97ff5b-a2d0-4e44-802f-521f3f097f00');
    process.exit(1);
  }

  const generator = new QuestionAnswerReportGenerator(testId);
  
  try {
    await generator.connect();
    await generator.generateReport();
  } catch (error) {
    console.error('❌ Failed to generate report:', error);
    process.exit(1);
  } finally {
    await generator.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
} 