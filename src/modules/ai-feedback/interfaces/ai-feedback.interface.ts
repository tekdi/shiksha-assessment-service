export interface AiFeedbackResult {
  score: number;
  maxScore: number;
  strengths: string[];
  areasForImprovement: string[];
  overallFeedback: string;
}

export interface DevRevExecuteAsyncPayload {
  agent: string;
  event: {
    input_message: {
      message: string;
    };
  };
  session_object: string;
  webhook_target: {
    webhook: string;
  };
  client_metadata: {
    attemptAnsId: string;
    attemptId: string;
    questionId: string;
    jobId: string;
    rubric_id?: string;
  };
}

export interface DevRevWebhookEvent {
  type: string;
  verify?: {
    challenge: string;
  };
  ai_agent_response?: DevRevAgentResponse;
}

export interface DevRevAgentResponse {
  agent_response: 'progress' | 'message' | 'error';
  session_object: string;
  client_metadata?: {
    attemptAnsId: string;
    attemptId: string;
    questionId: string;
    jobId: string;
  };
  progress?: {
    progress_state: string;
    skill_triggered?: { skill_name: string };
    skill_executed?: { skill_name: string };
  };
  message?: string;
  session?: string;
  error?: {
    message: string;
    [key: string]: any;
  };
}

export interface CreateAiFeedbackJobsInput {
  attemptId: string;
  tenantId: string;
  organisationId: string;
  rubricId?: string;
  answers: Array<{
    attemptAnsId: string;
    questionId: string;
  }>;
}

export interface AiFeedbackQueueJobData {
  jobId: string;
  attemptAnsId: string;
  attemptId: string;
  questionId: string;
  tenantId: string;
  organisationId: string;
  rubricId?: string;
}

export interface QuestionContext {
  questionId: string;
  questionText: string;
  answer: any;
  rubric?: Array<{ name: string; maxScore: number; description?: string }>;
  maxScore?: number;
}
