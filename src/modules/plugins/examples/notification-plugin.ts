import { Plugin, PluginHook } from '@/common/interfaces/plugin.interface';
import { PluginManagerService } from '@/common/services/plugin-manager.service';

export class NotificationPlugin implements Plugin {
  id = 'notification-plugin';
  name = 'Notification Plugin';
  version = '1.0.0';
  description = 'Sends notifications for various assessment events';
  author = 'Assessment Team';
  isActive = true;
  settings = {
    emailNotifications: true,
    slackNotifications: false,
    slackWebhookUrl: '',
  };

  hooks: PluginHook[] = [
    {
      name: PluginManagerService.EVENTS.ATTEMPT_SUBMITTED,
      priority: 100,
      handler: async (event) => {
        console.log(`[NotificationPlugin] Attempt submitted by user ${event.context.userId}`);
        
        // Send email notification
        if (this.settings.emailNotifications) {
          await this.sendEmailNotification(event);
        }
        
        // Send Slack notification
        if (this.settings.slackNotifications && this.settings.slackWebhookUrl) {
          await this.sendSlackNotification(event);
        }
      },
    },
    {
      name: PluginManagerService.EVENTS.ATTEMPT_REVIEWED,
      priority: 90,
      handler: async (event) => {
        console.log(`[NotificationPlugin] Attempt reviewed for user ${event.context.userId}`);
        
        // Send notification to student about review completion
        await this.sendReviewCompletionNotification(event);
      },
    },
    {
      name: PluginManagerService.EVENTS.TEST_PUBLISHED,
      priority: 80,
      handler: async (event) => {
        console.log(`[NotificationPlugin] Test published: ${event.data?.testId}`);
        
        // Notify relevant users about new test
        await this.sendTestPublishedNotification(event);
      },
    },
  ];

  private async sendEmailNotification(event: any): Promise<void> {
    // Implementation for sending email notifications
    console.log(`[NotificationPlugin] Sending email notification for event: ${event.name}`);
  }

  private async sendSlackNotification(event: any): Promise<void> {
    // Implementation for sending Slack notifications
    console.log(`[NotificationPlugin] Sending Slack notification for event: ${event.name}`);
  }

  private async sendReviewCompletionNotification(event: any): Promise<void> {
    // Implementation for sending review completion notifications
    console.log(`[NotificationPlugin] Sending review completion notification`);
  }

  private async sendTestPublishedNotification(event: any): Promise<void> {
    // Implementation for sending test published notifications
    console.log(`[NotificationPlugin] Sending test published notification`);
  }
} 