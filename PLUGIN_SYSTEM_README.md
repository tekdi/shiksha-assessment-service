# 🔌 Plugin System Implementation

This document explains the hybrid plugin system that supports both **internal plugins** (Phase 1) and **external services** (Phase 2) for the Assessment Microservice.

## 🏗️ Architecture Overview

### **Phase 1: Internal Plugins** (Current Implementation)
- Plugins run within the same microservice
- Direct function calls with no network latency
- Perfect for development and testing
- Simple deployment and debugging

### **Phase 2: External Services** (Production Ready)
- Events sent to external microservices via webhooks
- Scalable and loosely coupled architecture
- Independent deployment and technology choices
- Enterprise-grade reliability

### **Phase 3: Hybrid Approach** (Best of Both Worlds)
- Critical functionality uses internal plugins
- Scalable features use external services
- Gradual migration path from Phase 1 to Phase 2

## 📁 File Structure

```
src/
├── common/
│   ├── interfaces/
│   │   ├── plugin.interface.ts          # Plugin interfaces
│   │   └── migration.interface.ts       # Migration interfaces
│   └── services/
│       ├── plugin-manager.service.ts    # Enhanced plugin manager
│       └── migration.service.ts         # Database migration service
├── modules/
│   ├── plugins/
│   │   ├── examples/
│   │   │   ├── notification-plugin.ts   # Internal notification plugin
│   │   │   ├── analytics-plugin.ts      # Internal analytics plugin
│   │   │   └── webhook-plugin.ts        # External webhook plugin
│   │   ├── plugin-config.example.ts     # Configuration examples
│   │   └── plugin.module.ts             # Plugin module
│   └── attempts/
│       └── attempts.service.ts          # Updated with plugin triggers
```

## 🚀 Quick Start

### **1. Basic Usage (Internal Plugins)**

```typescript
// Register internal plugins
const notificationPlugin = new NotificationPlugin();
const analyticsPlugin = new AnalyticsPlugin();

pluginManager.registerPlugin(notificationPlugin);
pluginManager.registerPlugin(analyticsPlugin);

// Trigger events (automatically handled by internal plugins)
await pluginManager.triggerEvent('attempt.submitted', context, data);
```

### **2. External Services (Webhooks)**

```typescript
// Register external webhook service
pluginManager.registerExternalService({
  type: 'webhook',
  webhook: {
    url: 'https://external-service.com/webhooks',
    method: 'POST',
    headers: { 'Authorization': 'Bearer API_KEY' },
    timeout: 10000,
    retries: 3,
    events: ['attempt.submitted', 'attempt.reviewed']
  }
});

// Events are automatically sent to external service
await pluginManager.triggerEvent('attempt.submitted', context, data);
```

### **3. Hybrid Configuration**

```typescript
// Use the configuration helper
await PluginConfiguration.registerPlugins(pluginManager);

// Environment variables control the approach:
// NODE_ENV=development          → Internal plugins
// NODE_ENV=production           → External services  
// USE_HYBRID_PLUGINS=true       → Both internal and external
```

## 📋 Available Events

### **Test Events**
- `test.created` - New test created
- `test.updated` - Test updated
- `test.deleted` - Test deleted
- `test.published` - Test published
- `test.unpublished` - Test unpublished

### **Question Events**
- `question.created` - New question created
- `question.updated` - Question updated
- `question.deleted` - Question deleted
- `question.published` - Question published

### **Attempt Events**
- `attempt.started` - User started test attempt
- `attempt.submitted` - User submitted test
- `attempt.reviewed` - Test reviewed by instructor
- `answer.submitted` - Individual answer submitted

### **Rule Events**
- `rule.created` - New rule created
- `rule.updated` - Rule updated
- `rule.deleted` - Rule deleted

### **User Events**
- `user.registered` - New user registration
- `user.login` - User login
- `user.logout` - User logout

### **System Events**
- `system.startup` - Application startup
- `system.shutdown` - Application shutdown
- `error.occurred` - Error occurred

## 🔧 Configuration Examples

### **Environment Variables**

```bash
# Development (Internal Plugins)
NODE_ENV=development
USE_INTERNAL_PLUGINS=true

# Production (External Services)
NODE_ENV=production
USE_EXTERNAL_SERVICES=true

# Hybrid Approach
USE_HYBRID_PLUGINS=true
```

### **Plugin Configuration**

```typescript
// Internal Plugin Example
export class NotificationPlugin implements Plugin {
  id = 'notification-plugin';
  name = 'Notification Plugin';
  type: 'internal' = 'internal';
  isActive = true;
  
  hooks: PluginHook[] = [
    {
      name: 'attempt.submitted',
      priority: 100,
      handler: async (event) => {
        // Send email notification
        await this.sendEmail(event.data);
      }
    }
  ];
}

// External Plugin Example
export class WebhookPlugin implements Plugin {
  id = 'webhook-plugin';
  name = 'Webhook Plugin';
  type: 'external' = 'external';
  isActive = true;
  hooks = []; // No internal hooks
  
  externalService = {
    type: 'webhook',
    webhook: {
      url: 'https://api.external.com/webhooks',
      method: 'POST',
      headers: { 'Authorization': 'Bearer KEY' },
      timeout: 10000,
      retries: 3,
      events: ['attempt.submitted']
    }
  };
}
```

## 🌐 External Service Integration

### **Webhook Integration**

```typescript
// External service receives events
@Controller('webhooks')
export class WebhookController {
  @Post('assessment-events')
  async handleAssessmentEvent(@Body() event: PluginEvent) {
    switch (event.name) {
      case 'attempt.submitted':
        await this.lmsService.syncGrade(event.data);
        break;
      case 'attempt.reviewed':
        await this.notificationService.notifyStudent(event.data);
        break;
    }
  }
}
```

### **Message Queue Integration** (Future)

```typescript
// RabbitMQ integration
pluginManager.registerExternalService({
  type: 'message-queue',
  queue: {
    name: 'assessment-events',
    exchange: 'events',
    routingKey: 'assessment.*'
  }
});
```

### **Event Streaming** (Future)

```typescript
// Kafka integration
pluginManager.registerExternalService({
  type: 'event-stream',
  stream: {
    topic: 'assessment-events',
    partition: 0
  }
});
```

## 📊 Monitoring & Statistics

```typescript
// Get plugin statistics
const stats = PluginConfiguration.getPluginStats(pluginManager);
console.log(stats);

// Output:
{
  totalPlugins: 3,
  totalHooks: 8,
  externalServices: 2,
  registeredEvents: ['attempt.submitted', 'attempt.reviewed', ...],
  activePlugins: [
    { id: 'notification-plugin', name: 'Notification Plugin', type: 'internal', hookCount: 3 },
    { id: 'webhook-plugin', name: 'Webhook Plugin', type: 'external', hookCount: 0 }
  ]
}
```

## 🔄 Migration Path

### **Step 1: Start with Internal Plugins**
```typescript
// Development phase
const notificationPlugin = new NotificationPlugin();
pluginManager.registerPlugin(notificationPlugin);
```

### **Step 2: Add External Services**
```typescript
// Production phase
pluginManager.registerExternalService({
  type: 'webhook',
  webhook: { url: 'https://external-service.com/webhooks' }
});
```

### **Step 3: Hybrid Approach**
```typescript
// Gradual migration
// Keep critical internal plugins
// Add external services for scalability
```

### **Step 4: Full External Services**
```typescript
// Eventually migrate all to external services
// Remove internal plugins
```

## 🛠️ Database Migration System

The system also includes a robust database migration service:

```typescript
// Run migrations
const result = await migrationService.runMigrations(migrations);

// Rollback migrations
const rollbackResult = await migrationService.rollbackMigrations(2);

// Get migration status
const status = await migrationService.getMigrationStatus();
```

## ✅ Benefits

### **Internal Plugins**
- ✅ Fast execution (no network calls)
- ✅ Simple debugging
- ✅ Shared database connections
- ✅ Easy deployment

### **External Services**
- ✅ Scalable architecture
- ✅ Technology independence
- ✅ Fault isolation
- ✅ Independent deployment

### **Hybrid Approach**
- ✅ Best of both worlds
- ✅ Gradual migration path
- ✅ Risk mitigation
- ✅ Flexibility

## 🚀 Next Steps

1. **Start with internal plugins** for development
2. **Add external services** for production scalability
3. **Implement message queues** for high-volume scenarios
4. **Add event streaming** for real-time analytics
5. **Create plugin marketplace** for third-party integrations

This hybrid plugin system provides a flexible, scalable foundation for the assessment microservice that can grow with your needs! 🎯 