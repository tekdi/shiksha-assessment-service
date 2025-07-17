import { Plugin, PluginHook, ExternalServiceConfig } from '@/common/interfaces/plugin.interface';
import { PluginManagerService } from '@/common/services/plugin-manager.service';

/**
 * Example webhook plugin for calling external services
 * This plugin demonstrates how to integrate with external services
 * when attempts are created or tests are published
 */
export class ExternalServiceWebhookPlugin implements Plugin {
  id = 'external-service-webhook';
  name = 'External Service Webhook Plugin';
  version = '1.0.0';
  description = 'Calls external services when attempts are created or tests are published';
  author = 'Shiksha Assessment Service';
  type: 'external' = 'external';
  isActive = true;

  // Configure external services to call
  externalService: ExternalServiceConfig = {
    type: 'webhook',
    webhook: {
      url: process.env.EXTERNAL_SERVICE_WEBHOOK_URL || 'https://api.example.com/webhook',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXTERNAL_SERVICE_API_KEY || ''}`,
        'X-Service-Name': 'shiksha-assessment',
      },
      timeout: 10000,
      retries: 3,
      events: [
        PluginManagerService.EVENTS.ATTEMPT_STARTED,
        PluginManagerService.EVENTS.TEST_PUBLISHED,
        PluginManagerService.EVENTS.ATTEMPT_SUBMITTED,
      ],
    },
  };

  // Internal hooks for additional processing (optional)
  hooks: PluginHook[] = [
    {
      name: PluginManagerService.EVENTS.ATTEMPT_STARTED,
      handler: async (event) => {
        console.log(`[ExternalServiceWebhook] Attempt started: ${event.data.attemptId}`);
        
        // You can add additional internal processing here
        // For example, logging to a local database, sending notifications, etc.
        
        // The webhook will be automatically triggered by the plugin manager
      },
      priority: 100,
    },
    {
      name: PluginManagerService.EVENTS.TEST_PUBLISHED,
      handler: async (event) => {
        console.log(`[ExternalServiceWebhook] Test published: ${event.data.testId}`);
        
        // Additional internal processing for test publication
        // For example, updating analytics, sending notifications to stakeholders, etc.
      },
      priority: 100,
    },
    {
      name: PluginManagerService.EVENTS.ATTEMPT_SUBMITTED,
      handler: async (event) => {
        console.log(`[ExternalServiceWebhook] Attempt submitted: ${event.data.attemptId}`);
        
        // Additional internal processing for attempt submission
        // For example, updating progress tracking, sending completion notifications, etc.
      },
      priority: 100,
    },
  ];
}

/**
 * Alternative plugin configuration for multiple external services
 * This example shows how to configure multiple webhooks for different purposes
 */
export class MultiServiceWebhookPlugin implements Plugin {
  id = 'multi-service-webhook';
  name = 'Multi-Service Webhook Plugin';
  version = '1.0.0';
  description = 'Calls multiple external services for different events';
  author = 'Shiksha Assessment Service';
  type: 'external' = 'external';
  isActive = true;

  // Configure multiple external services
  externalService: ExternalServiceConfig = {
    type: 'webhook',
    webhook: {
      url: process.env.ANALYTICS_SERVICE_WEBHOOK_URL || 'https://analytics.example.com/events',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANALYTICS_SERVICE_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
      retries: 2,
      events: [
        PluginManagerService.EVENTS.ATTEMPT_STARTED,
        PluginManagerService.EVENTS.ATTEMPT_SUBMITTED,
        PluginManagerService.EVENTS.TEST_PUBLISHED,
      ],
    },
  };

  hooks: PluginHook[] = [
    {
      name: PluginManagerService.EVENTS.ATTEMPT_STARTED,
      handler: async (event) => {
        // Send to notification service
        await this.sendToNotificationService(event);
      },
      priority: 50,
    },
    {
      name: PluginManagerService.EVENTS.TEST_PUBLISHED,
      handler: async (event) => {
        // Send to LMS integration service
        await this.sendToLMSService(event);
      },
      priority: 50,
    },
  ];

  private async sendToNotificationService(event: any): Promise<void> {
    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL;
    if (!notificationUrl) return;

    try {
      const response = await fetch(notificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY || ''}`,
        },
        body: JSON.stringify({
          type: event.name,
          data: event.data,
          timestamp: event.timestamp,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send notification: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private async sendToLMSService(event: any): Promise<void> {
    const lmsUrl = process.env.LMS_INTEGRATION_URL;
    if (!lmsUrl) return;

    try {
      const response = await fetch(lmsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LMS_API_KEY || ''}`,
        },
        body: JSON.stringify({
          event: event.name,
          testId: event.data.testId,
          testTitle: event.data.testTitle,
          action: 'test_published',
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send to LMS: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending to LMS:', error);
    }
  }
}

/**
 * Configuration example for environment variables
 * Add these to your .env file:
 * 
 * # External Service Webhook Configuration
 * EXTERNAL_SERVICE_WEBHOOK_URL=https://your-service.com/webhook
 * EXTERNAL_SERVICE_API_KEY=your-api-key-here
 * 
 * # Analytics Service
 * ANALYTICS_SERVICE_WEBHOOK_URL=https://analytics.your-service.com/events
 * ANALYTICS_SERVICE_API_KEY=your-analytics-api-key
 * 
 * # Notification Service
 * NOTIFICATION_SERVICE_URL=https://notifications.your-service.com/api/notify
 * NOTIFICATION_SERVICE_API_KEY=your-notification-api-key
 * 
 * # LMS Integration
 * LMS_INTEGRATION_URL=https://lms.your-service.com/api/integration
 * LMS_API_KEY=your-lms-api-key
 */ 