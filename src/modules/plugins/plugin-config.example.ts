import { PluginManagerService } from '@/common/services/plugin-manager.service';
import { NotificationPlugin } from './examples/notification-plugin';
import { AnalyticsPlugin } from './examples/analytics-plugin';
import { WebhookPlugin } from './examples/webhook-plugin';

/**
 * Example configuration for registering plugins
 * This demonstrates both internal and external plugin registration
 */
export class PluginConfiguration {
  
  /**
   * Register all plugins for the application
   */
  static async registerPlugins(pluginManager: PluginManagerService): Promise<void> {
    
    // Phase 1: Internal Plugins (for development/testing)
    if (this.shouldUseInternalPlugins()) {
      await this.registerInternalPlugins(pluginManager);
    }
    
    // Phase 2: External Services (for production)
    if (this.shouldUseExternalServices()) {
      await this.registerExternalServices(pluginManager);
    }
    
    // Phase 3: Hybrid Approach (both internal and external)
    if (this.shouldUseHybridApproach()) {
      await this.registerHybridPlugins(pluginManager);
    }
  }

  /**
   * Register internal plugins (Phase 1)
   */
  private static async registerInternalPlugins(pluginManager: PluginManagerService): Promise<void> {
    console.log('🔌 Registering internal plugins...');
    
    // Notification plugin for development
    const notificationPlugin = new NotificationPlugin();
    pluginManager.registerPlugin(notificationPlugin);
    
    // Analytics plugin for development
    const analyticsPlugin = new AnalyticsPlugin();
    pluginManager.registerPlugin(analyticsPlugin);
    
    console.log(`✅ Registered ${pluginManager.getPluginCount()} internal plugins`);
  }

  /**
   * Register external services (Phase 2)
   */
  private static async registerExternalServices(pluginManager: PluginManagerService): Promise<void> {
    console.log('🌐 Registering external services...');
    
    // Webhook integration
    const webhookPlugin = new WebhookPlugin();
    pluginManager.registerPlugin(webhookPlugin);
    
    // You can also register external services directly
    pluginManager.registerExternalService({
      type: 'webhook',
      webhook: {
        url: 'https://lms-service.com/webhooks/assessment-events',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer LMS_API_KEY',
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        retries: 5,
        events: ['attempt.submitted', 'attempt.reviewed']
      }
    });
    
    console.log(`✅ Registered ${pluginManager.getExternalServiceCount()} external services`);
  }

  /**
   * Register hybrid approach (Phase 3)
   */
  private static async registerHybridPlugins(pluginManager: PluginManagerService): Promise<void> {
    console.log('🔄 Registering hybrid plugins...');
    
    // Internal plugins for critical functionality
    const notificationPlugin = new NotificationPlugin();
    pluginManager.registerPlugin(notificationPlugin);
    
    // External services for scalability
    const webhookPlugin = new WebhookPlugin();
    pluginManager.registerPlugin(webhookPlugin);
    
    // Direct external service registration
    pluginManager.registerExternalService({
      type: 'webhook',
      webhook: {
        url: 'https://analytics-service.com/events',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ANALYTICS_API_KEY'
        },
        timeout: 10000,
        retries: 3,
        events: ['attempt.started', 'attempt.submitted', 'answer.submitted']
      }
    });
    
    console.log(`✅ Registered hybrid setup: ${pluginManager.getPluginCount()} plugins + ${pluginManager.getExternalServiceCount()} external services`);
  }

  /**
   * Environment-based configuration
   */
  private static shouldUseInternalPlugins(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.USE_INTERNAL_PLUGINS === 'true';
  }

  private static shouldUseExternalServices(): boolean {
    return process.env.NODE_ENV === 'production' || process.env.USE_EXTERNAL_SERVICES === 'true';
  }

  private static shouldUseHybridApproach(): boolean {
    return process.env.USE_HYBRID_PLUGINS === 'true';
  }

  /**
   * Get plugin statistics
   */
  static getPluginStats(pluginManager: PluginManagerService): any {
    return {
      totalPlugins: pluginManager.getPluginCount(),
      totalHooks: pluginManager.getHookCount(),
      externalServices: pluginManager.getExternalServiceCount(),
      registeredEvents: pluginManager.getRegisteredEvents(),
      activePlugins: pluginManager.getActivePlugins().map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        hookCount: p.hooks.length
      }))
    };
  }
}

/**
 * Example usage in main.ts or app.module.ts:
 * 
 * ```typescript
 * // In main.ts
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   
 *   // Get plugin manager from the app
 *   const pluginManager = app.get(PluginManagerService);
 *   
 *   // Register plugins based on configuration
 *   await PluginConfiguration.registerPlugins(pluginManager);
 *   
 *   // Log plugin statistics
 *   console.log('Plugin Stats:', PluginConfiguration.getPluginStats(pluginManager));
 *   
 *   await app.listen(3000);
 * }
 * ```
 */ 