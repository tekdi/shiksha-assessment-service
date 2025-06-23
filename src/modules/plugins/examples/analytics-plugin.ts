import { Plugin, PluginHook } from '@/common/interfaces/plugin.interface';
import { PluginManagerService } from '@/common/services/plugin-manager.service';

export class AnalyticsPlugin implements Plugin {
  id = 'analytics-plugin';
  name = 'Analytics Plugin';
  version = '1.0.0';
  description = 'Tracks analytics for assessment events';
  author = 'Assessment Team';
  isActive = true;
  settings = {
    trackUserBehavior: true,
    trackPerformance: true,
    exportToExternal: false,
  };

  hooks: PluginHook[] = [
    {
      name: PluginManagerService.EVENTS.ATTEMPT_STARTED,
      priority: 50,
      handler: async (event) => {
        console.log(`[AnalyticsPlugin] Tracking attempt start: ${event.data?.attemptId}`);
        await this.trackAttemptStart(event);
      },
    },
    {
      name: PluginManagerService.EVENTS.ATTEMPT_SUBMITTED,
      priority: 50,
      handler: async (event) => {
        console.log(`[AnalyticsPlugin] Tracking attempt submission: ${event.data?.attemptId}`);
        await this.trackAttemptSubmission(event);
      },
    },
    {
      name: PluginManagerService.EVENTS.ANSWER_SUBMITTED,
      priority: 50,
      handler: async (event) => {
        console.log(`[AnalyticsPlugin] Tracking answer submission: ${event.data?.questionId}`);
        await this.trackAnswerSubmission(event);
      },
    },
    {
      name: PluginManagerService.EVENTS.QUESTION_CREATED,
      priority: 50,
      handler: async (event) => {
        console.log(`[AnalyticsPlugin] Tracking question creation: ${event.data?.questionId}`);
        await this.trackQuestionCreation(event);
      },
    },
  ];

  private async trackAttemptStart(event: any): Promise<void> {
    // Track attempt start analytics
    const analyticsData = {
      event: 'attempt_started',
      userId: event.context.userId,
      testId: event.data?.testId,
      attemptId: event.data?.attemptId,
      timestamp: new Date().toISOString(),
      tenantId: event.context.tenantId,
      organisationId: event.context.organisationId,
    };

    console.log(`[AnalyticsPlugin] Analytics data:`, analyticsData);
    
    // Store analytics data
    await this.storeAnalyticsData(analyticsData);
  }

  private async trackAttemptSubmission(event: any): Promise<void> {
    // Track attempt submission analytics
    const analyticsData = {
      event: 'attempt_submitted',
      userId: event.context.userId,
      testId: event.data?.testId,
      attemptId: event.data?.attemptId,
      score: event.data?.score,
      timeSpent: event.data?.timeSpent,
      timestamp: new Date().toISOString(),
      tenantId: event.context.tenantId,
      organisationId: event.context.organisationId,
    };

    console.log(`[AnalyticsPlugin] Analytics data:`, analyticsData);
    
    // Store analytics data
    await this.storeAnalyticsData(analyticsData);
  }

  private async trackAnswerSubmission(event: any): Promise<void> {
    // Track answer submission analytics
    const analyticsData = {
      event: 'answer_submitted',
      userId: event.context.userId,
      questionId: event.data?.questionId,
      attemptId: event.data?.attemptId,
      timeSpent: event.data?.timeSpent,
      timestamp: new Date().toISOString(),
      tenantId: event.context.tenantId,
      organisationId: event.context.organisationId,
    };

    console.log(`[AnalyticsPlugin] Analytics data:`, analyticsData);
    
    // Store analytics data
    await this.storeAnalyticsData(analyticsData);
  }

  private async trackQuestionCreation(event: any): Promise<void> {
    // Track question creation analytics
    const analyticsData = {
      event: 'question_created',
      userId: event.context.userId,
      questionId: event.data?.questionId,
      questionType: event.data?.type,
      difficultyLevel: event.data?.level,
      timestamp: new Date().toISOString(),
      tenantId: event.context.tenantId,
      organisationId: event.context.organisationId,
    };

    console.log(`[AnalyticsPlugin] Analytics data:`, analyticsData);
    
    // Store analytics data
    await this.storeAnalyticsData(analyticsData);
  }

  private async storeAnalyticsData(data: any): Promise<void> {
    // Implementation for storing analytics data
    // This could be stored in a database, sent to external analytics service, etc.
    console.log(`[AnalyticsPlugin] Storing analytics data for event: ${data.event}`);
  }
} 