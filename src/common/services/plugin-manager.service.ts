import { Injectable, Logger } from '@nestjs/common';
import { Plugin, PluginManager, PluginEvent, PluginContext, PluginHook, ExternalServiceConfig, WebhookConfig } from '../interfaces/plugin.interface';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class PluginManagerService implements PluginManager {
  private readonly logger = new Logger(PluginManagerService.name);
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();
  private externalServices: Map<string, ExternalServiceConfig> = new Map();

  // Predefined event names
  static readonly EVENTS = {
    // Test events
    TEST_CREATED: 'test.created',
    TEST_UPDATED: 'test.updated',
    TEST_DELETED: 'test.deleted',
    TEST_PUBLISHED: 'test.published',
    TEST_UNPUBLISHED: 'test.unpublished',
    
    // Question events
    QUESTION_CREATED: 'question.created',
    QUESTION_UPDATED: 'question.updated',
    QUESTION_DELETED: 'question.deleted',
    QUESTION_PUBLISHED: 'question.published',
    
    // Attempt events
    ATTEMPT_STARTED: 'attempt.started',
    ATTEMPT_SUBMITTED: 'attempt.submitted',
    ATTEMPT_REVIEWED: 'attempt.reviewed',
    ANSWER_SUBMITTED: 'answer.submitted',
    
    // Rule events
    RULE_CREATED: 'rule.created',
    RULE_UPDATED: 'rule.updated',
    RULE_DELETED: 'rule.deleted',
    
    // User events
    USER_REGISTERED: 'user.registered',
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    
    // System events
    SYSTEM_STARTUP: 'system.startup',
    SYSTEM_SHUTDOWN: 'system.shutdown',
    ERROR_OCCURRED: 'error.occurred',
  };

  registerPlugin(plugin: Plugin): void {
    this.logger.log(`Registering plugin: ${plugin.name} (${plugin.id})`);
    
    if (this.plugins.has(plugin.id)) {
      this.logger.warn(`Plugin ${plugin.id} is already registered. Overwriting...`);
    }

    // Set default type if not specified
    if (!plugin.type) {
      plugin.type = 'internal';
    }

    this.plugins.set(plugin.id, plugin);

    // Register hooks for internal plugins
    if (plugin.type === 'internal') {
      for (const hook of plugin.hooks) {
        if (!this.hooks.has(hook.name)) {
          this.hooks.set(hook.name, []);
        }
        
        const hooks = this.hooks.get(hook.name)!;
        hooks.push(hook);
        
        // Sort by priority (higher priority first)
        hooks.sort((a, b) => b.priority - a.priority);
      }
    }

    // Register external service if configured
    if (plugin.externalService) {
      this.registerExternalService(plugin.externalService);
    }

    this.logger.log(`Plugin ${plugin.name} registered with ${plugin.hooks.length} hooks`);
  }

  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      this.logger.warn(`Plugin ${pluginId} not found for unregistration`);
      return;
    }

    this.logger.log(`Unregistering plugin: ${plugin.name} (${pluginId})`);

    // Remove hooks for internal plugins
    if (plugin.type === 'internal') {
      for (const hook of plugin.hooks) {
        const hooks = this.hooks.get(hook.name);
        if (hooks) {
          const index = hooks.findIndex(h => h === hook);
          if (index !== -1) {
            hooks.splice(index, 1);
          }
          
          // Remove empty hook arrays
          if (hooks.length === 0) {
            this.hooks.delete(hook.name);
          }
        }
      }
    }

    // Remove external service if configured
    if (plugin.externalService) {
      this.unregisterExternalService(pluginId);
    }

    this.plugins.delete(pluginId);
    this.logger.log(`Plugin ${plugin.name} unregistered`);
  }

  registerExternalService(config: ExternalServiceConfig): void {
    const serviceId = this.generateServiceId(config);
    this.externalServices.set(serviceId, config);
    this.logger.log(`External service registered: ${serviceId}`);
  }

  unregisterExternalService(serviceId: string): void {
    this.externalServices.delete(serviceId);
    this.logger.log(`External service unregistered: ${serviceId}`);
  }

  async triggerEvent(eventName: string, context: PluginContext, data?: any): Promise<PluginEvent> {
    const event: PluginEvent = {
      name: eventName,
      context,
      data,
      timestamp: new Date().toISOString(),
      id: this.generateEventId(),
    };

    this.logger.debug(`Triggering event: ${eventName}`);

    // Execute internal plugins first
    await this.executeInternalPlugins(event);

    // Then trigger external services
    await this.triggerExternalServices(event);

    return event;
  }

  private async executeInternalPlugins(event: PluginEvent): Promise<void> {
    const hooks = this.hooks.get(event.name) || [];
    
    if (hooks.length === 0) {
      this.logger.debug(`No internal hooks found for event: ${event.name}`);
      return;
    }

    this.logger.debug(`Found ${hooks.length} internal hooks for event: ${event.name}`);

    // Execute hooks in priority order
    for (const hook of hooks) {
      try {
        this.logger.debug(`Executing internal hook for event ${event.name} with priority ${hook.priority}`);
        
        const result = hook.handler(event);
        
        if (result instanceof Promise) {
          await result;
        }
        
        this.logger.debug(`Internal hook executed successfully for event ${event.name}`);
      } catch (error) {
        this.logger.error(`Error executing internal hook for event ${event.name}: ${error.message}`, error.stack);
        
        // Continue with other hooks even if one fails
        event.result = {
          error: error.message,
          hook: hook.name,
        };
      }
    }
  }

  private async triggerExternalServices(event: PluginEvent): Promise<void> {
    const externalServices = Array.from(this.externalServices.values());
    
    if (externalServices.length === 0) {
      this.logger.debug(`No external services configured for event: ${event.name}`);
      return;
    }

    this.logger.debug(`Found ${externalServices.length} external services for event: ${event.name}`);

    // Trigger external services in parallel
    const promises = externalServices.map(service => this.triggerExternalService(service, event));
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error(`Error triggering external services for event ${event.name}: ${error.message}`);
    }
  }

  private async triggerExternalService(service: ExternalServiceConfig, event: PluginEvent): Promise<void> {
    try {
      switch (service.type) {
        case 'webhook':
          await this.triggerWebhook(service.webhook!, event);
          break;
        case 'message-queue':
          await this.triggerMessageQueue(service.queue!, event);
          break;
        case 'event-stream':
          await this.triggerEventStream(service.stream!, event);
          break;
        default:
          this.logger.warn(`Unknown external service type: ${service.type}`);
      }
    } catch (error) {
      this.logger.error(`Error triggering external service: ${error.message}`);
    }
  }

  private async triggerWebhook(webhook: WebhookConfig, event: PluginEvent): Promise<void> {
    // Check if webhook should handle this event
    if (webhook.events && !webhook.events.includes(event.name)) {
      return;
    }

    const config: AxiosRequestConfig = {
      method: webhook.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...webhook.headers,
      },
      timeout: webhook.timeout || 10000,
    };

    try {
      await axios(webhook.url, {
        ...config,
        data: event,
      });
      
      this.logger.debug(`Webhook triggered successfully: ${webhook.url}`);
    } catch (error) {
      this.logger.error(`Webhook failed: ${webhook.url}`, error.message);
      
      // Retry logic
      if (webhook.retries && webhook.retries > 0) {
        await this.retryWebhook(webhook, event, webhook.retries);
      }
    }
  }

  private async retryWebhook(webhook: WebhookConfig, event: PluginEvent, retries: number): Promise<void> {
    for (let i = 1; i <= retries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, i * 1000)); // Exponential backoff
        
        await axios(webhook.url, {
          method: webhook.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...webhook.headers,
          },
          timeout: webhook.timeout || 10000,
          data: event,
        });
        
        this.logger.debug(`Webhook retry successful: ${webhook.url} (attempt ${i})`);
        return;
      } catch (error) {
        this.logger.error(`Webhook retry failed: ${webhook.url} (attempt ${i})`, error.message);
      }
    }
  }

  private async triggerMessageQueue(queue: any, event: PluginEvent): Promise<void> {
    // Implementation for message queue (RabbitMQ, etc.)
    this.logger.debug(`Message queue trigger not implemented yet for: ${queue.name}`);
  }

  private async triggerEventStream(stream: any, event: PluginEvent): Promise<void> {
    // Implementation for event streaming (Kafka, etc.)
    this.logger.debug(`Event stream trigger not implemented yet for: ${stream.topic}`);
  }

  private generateServiceId(config: ExternalServiceConfig): string {
    switch (config.type) {
      case 'webhook':
        return `webhook-${config.webhook!.url}`;
      case 'message-queue':
        return `queue-${config.queue!.name}`;
      case 'event-stream':
        return `stream-${config.stream!.topic}`;
      default:
        return `external-${Date.now()}`;
    }
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.isActive);
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getHooksForEvent(eventName: string): PluginHook[] {
    return this.hooks.get(eventName) || [];
  }

  getRegisteredEvents(): string[] {
    return Array.from(this.hooks.keys());
  }

  getPluginCount(): number {
    return this.plugins.size;
  }

  getHookCount(): number {
    return Array.from(this.hooks.values()).reduce((total, hooks) => total + hooks.length, 0);
  }

  getExternalServiceCount(): number {
    return this.externalServices.size;
  }
} 