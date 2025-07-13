# External Service Integration Guide

This guide explains how to set up external service integration to call other services when attempts are created or tests are published in the Shiksha Assessment Service.

## Overview

The assessment service uses a plugin system to trigger events when certain actions occur:

- **Attempt Started**: When a user starts a test attempt
- **Test Published**: When a test is published and made available for attempts
- **Attempt Submitted**: When a user submits a completed test attempt
- **Answer Submitted**: When a user submits an individual answer

## Available Events

The following events are automatically triggered by the system:

### Attempt Events
- `attempt.started` - Triggered when a user starts a test attempt
- `attempt.submitted` - Triggered when a user submits a completed attempt
- `answer.submitted` - Triggered when a user submits an individual answer

### Test Events
- `test.published` - Triggered when a test is published
- `test.unpublished` - Triggered when a test is unpublished

## Setting Up External Service Integration

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# External Service Webhook Configuration
The plugin system is already in place and working
The plugin system is already in place and working
EXTERNAL_SERVICE_WEBHOOK_URL=https://your-service.com/webhook
EXTERNAL_SERVICE_API_KEY=your-api-key-here

# Analytics Service (optional)
ANALYTICS_SERVICE_WEBHOOK_URL=https://analytics.your-service.com/events
ANALYTICS_SERVICE_API_KEY=your-analytics-api-key

# Notification Service (optional)
NOTIFICATION_SERVICE_URL=https://notifications.your-service.com/api/notify
NOTIFICATION_SERVICE_API_KEY=your-notification-api-key

# LMS Integration (optional)
LMS_INTEGRATION_URL=https://lms.your-service.com/api/integration
LMS_API_KEY=your-lms-api-key
```

### 2. Plugin Registration

In your `app.module.ts`, register the external service plugins:

```typescript
import { Module } from '@nestjs/common';
import { PluginManagerService } from '@/common/services/plugin-manager.service';
import { configurePlugins } from './modules/plugins/plugin-config.example';

@Module({
  imports: [...],
  providers: [
    PluginManagerService,
    // ... other providers
  ],
})
export class AppModule {
  constructor(private pluginManager: PluginManagerService) {
    // Configure external service plugins
    configurePlugins(this.pluginManager);
  }
}
```

### 3. API Endpoints

#### Publish a Test
```http
POST /tests/{testId}/publish
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
X-Organisation-ID: <organisation-id>
```

#### Unpublish a Test
```http
POST /tests/{testId}/unpublish
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
X-Organisation-ID: <organisation-id>
```

## Webhook Payload Format

When events are triggered, the following payload is sent to your external service:

### Attempt Started Event
```json
{
  "name": "attempt.started",
  "context": {
    "tenantId": "tenant-123",
    "organisationId": "org-456",
    "userId": "user-789"
  },
  "data": {
    "attemptId": "attempt-abc",
    "testId": "test-def",
    "attemptNumber": 1
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "id": "event-1234567890"
}
```

### Test Published Event
```json
{
  "name": "test.published",
  "context": {
    "tenantId": "tenant-123",
    "organisationId": "org-456",
    "userId": "user-789"
  },
  "data": {
    "testId": "test-def",
    "testTitle": "Mathematics Final Exam",
    "testType": "plain",
    "totalMarks": 100,
    "questionCount": 25
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "id": "event-1234567890"
}
```

### Attempt Submitted Event
```json
{
  "name": "attempt.submitted",
  "context": {
    "tenantId": "tenant-123",
    "organisationId": "org-456",
    "userId": "user-789"
  },
  "data": {
    "attemptId": "attempt-abc",
    "testId": "test-def",
    "score": 85,
    "result": "pass",
    "timeSpent": 3600
  },
  "timestamp": "2024-01-15T11:30:00.000Z",
  "id": "event-1234567890"
}
```

## Example External Service Implementation

Here's an example of how to handle these webhooks in your external service:

### Node.js/Express Example
```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const { name, context, data, timestamp } = req.body;

  switch (name) {
    case 'attempt.started':
      handleAttemptStarted(context, data);
      break;
    case 'test.published':
      handleTestPublished(context, data);
      break;
    case 'attempt.submitted':
      handleAttemptSubmitted(context, data);
      break;
    default:
      console.log(`Unknown event: ${name}`);
  }

  res.status(200).json({ received: true });
});

function handleAttemptStarted(context, data) {
  console.log(`User ${context.userId} started attempt ${data.attemptId} for test ${data.testId}`);
  // Update user progress, send notifications, etc.
}

function handleTestPublished(context, data) {
  console.log(`Test ${data.testId} published with ${data.questionCount} questions`);
  // Update LMS, send notifications to students, etc.
}

function handleAttemptSubmitted(context, data) {
  console.log(`Attempt ${data.attemptId} submitted with score ${data.score}`);
  // Update grades, send completion notifications, etc.
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Python/Flask Example
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    event_name = data.get('name')
    context = data.get('context', {})
    event_data = data.get('data', {})

    if event_name == 'attempt.started':
        handle_attempt_started(context, event_data)
    elif event_name == 'test.published':
        handle_test_published(context, event_data)
    elif event_name == 'attempt.submitted':
        handle_attempt_submitted(context, event_data)
    else:
        print(f"Unknown event: {event_name}")

    return jsonify({"received": True})

def handle_attempt_started(context, data):
    print(f"User {context['userId']} started attempt {data['attemptId']}")

def handle_test_published(context, data):
    print(f"Test {data['testId']} published with {data['questionCount']} questions")

def handle_attempt_submitted(context, data):
    print(f"Attempt {data['attemptId']} submitted with score {data['score']}")

if __name__ == '__main__':
    app.run(port=3000)
```

## Error Handling and Retries

The webhook system includes automatic retry logic:

- **Timeout**: 10 seconds (configurable)
- **Retries**: 3 attempts (configurable)
- **Backoff**: Exponential backoff between retries

If your service is temporarily unavailable, the system will retry the webhook call automatically.

## Security Considerations

1. **Authentication**: Always use API keys or tokens for webhook authentication
2. **HTTPS**: Use HTTPS endpoints for production webhooks
3. **Validation**: Validate the webhook payload in your service
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## Monitoring and Debugging

### Enable Debug Logging
Set the log level to debug to see detailed webhook information:

```typescript
// In your main.ts or app configuration
const app = await NestFactory.create(AppModule, {
  logger: ['debug', 'log', 'warn', 'error'],
});
```

### Check Plugin Status
You can check the status of registered plugins:

```typescript
// In your service or controller
const pluginManager = this.pluginManager;
console.log('Active plugins:', pluginManager.getActivePlugins());
console.log('External services:', pluginManager.getExternalServiceCount());
```

## Troubleshooting

### Common Issues

1. **Webhook not received**: Check if the URL is accessible and the service is running
2. **Authentication errors**: Verify API keys and headers
3. **Timeout errors**: Ensure your service responds within the timeout period
4. **Retry failures**: Check server logs for detailed error messages

### Testing Webhooks

You can test webhooks using tools like:
- [webhook.site](https://webhook.site) - Temporary webhook endpoints for testing
- [ngrok](https://ngrok.com) - Expose local services to the internet
- [Postman](https://postman.com) - Test webhook endpoints

## Advanced Configuration

### Custom Plugin Development

You can create custom plugins for specific use cases:

```typescript
import { Plugin, PluginHook } from '@/common/interfaces/plugin.interface';

export class CustomWebhookPlugin implements Plugin {
  id = 'custom-webhook';
  name = 'Custom Webhook Plugin';
  version = '1.0.0';
  description = 'Custom webhook for specific events';
  author = 'Your Organization';
  type: 'external' = 'external';
  isActive = true;

  externalService = {
    type: 'webhook' as const,
    webhook: {
      url: 'https://your-custom-service.com/webhook',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-api-key',
        'Content-Type': 'application/json',
      },
      timeout: 15000,
      retries: 5,
      events: ['attempt.started', 'test.published'],
    },
  };

  hooks: PluginHook[] = [
    {
      name: 'attempt.started',
      handler: async (event) => {
        // Custom processing logic
        console.log('Custom processing for attempt started:', event.data);
      },
      priority: 100,
    },
  ];
}
```

### Environment-Specific Configuration

```typescript
// Configure plugins based on environment
export function configurePluginsByEnvironment(pluginManager: PluginManagerService): void {
  const environment = process.env.NODE_ENV || 'development';

  switch (environment) {
    case 'production':
      // Production: Register all plugins with proper error handling
      const externalServicePlugin = new ExternalServiceWebhookPlugin();
      pluginManager.registerPlugin(externalServicePlugin);
      break;

    case 'development':
      // Development: Register plugins only if URLs are configured
      if (process.env.EXTERNAL_SERVICE_WEBHOOK_URL) {
        const externalServicePlugin = new ExternalServiceWebhookPlugin();
        pluginManager.registerPlugin(externalServicePlugin);
      }
      break;

    case 'test':
      // Test: Don't register external plugins
      console.log('Test environment: External plugins not registered');
      break;
  }
}
```

## Support

For questions or issues with external service integration:

1. Check the application logs for detailed error messages
2. Verify your webhook endpoint is accessible and responding correctly
3. Ensure all required environment variables are set
4. Test with a simple webhook endpoint first (e.g., webhook.site)

## Related Documentation

- [Plugin System README](./PLUGIN_SYSTEM_README.md)
- [API Documentation](./docs/swagger.yaml)
- [Database Design](./docs/db-design.md) 