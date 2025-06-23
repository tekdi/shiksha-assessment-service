import { Plugin } from '@/common/interfaces/plugin.interface';

// Example webhook plugin for external service integration
export class WebhookPlugin implements Plugin {
  id = 'webhook-integration-plugin';
  name = 'Webhook Integration Plugin';
  version = '1.0.0';
  description = 'Sends events to external services via webhooks';
  author = 'Assessment Team';
  isActive = true;
  type: 'external' = 'external'; // This marks it as an external service plugin
  hooks = []; // No internal hooks for external plugins

  // External service configuration
  externalService = {
    type: 'webhook' as const,
    webhook: {
      url: 'https://api.external-service.com/webhooks/assessment-events',
      method: 'POST' as const,
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'X-Service-Name': 'assessment-service'
      },
      timeout: 10000,
      retries: 3,
      events: [
        'attempt.submitted',
        'attempt.reviewed',
        'test.published'
      ]
    }
  };

  settings = {
    enabled: true,
    webhookUrl: 'https://api.external-service.com/webhooks/assessment-events',
    apiKey: 'YOUR_API_KEY',
    retryAttempts: 3,
    timeout: 10000
  };
} 