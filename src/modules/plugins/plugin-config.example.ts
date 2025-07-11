import { PluginManagerService } from '@/common/services/plugin-manager.service';
import { ExternalServiceWebhookPlugin, MultiServiceWebhookPlugin } from './examples/external-service-webhook';

/**
 * Plugin Configuration Example
 * 
 * This file demonstrates how to configure and register plugins
 * for calling external services when events occur in the assessment service.
 * 
 * To use this configuration:
 * 1. Copy this file to plugin-config.ts
 * 2. Update the environment variables in your .env file
 * 3. Import and call configurePlugins() in your app.module.ts
 */

export function configurePlugins(pluginManager: PluginManagerService): void {
  // Register the external service webhook plugin
  const externalServicePlugin = new ExternalServiceWebhookPlugin();
  pluginManager.registerPlugin(externalServicePlugin);

  // Register the multi-service webhook plugin (optional)
  const multiServicePlugin = new MultiServiceWebhookPlugin();
  pluginManager.registerPlugin(multiServicePlugin);

  console.log('External service plugins configured successfully');
}

/**
 * Alternative configuration with conditional plugin registration
 * based on environment variables
 */
export function configurePluginsConditionally(pluginManager: PluginManagerService): void {
  // Only register external service plugin if webhook URL is configured
  if (process.env.EXTERNAL_SERVICE_WEBHOOK_URL) {
    const externalServicePlugin = new ExternalServiceWebhookPlugin();
    pluginManager.registerPlugin(externalServicePlugin);
    console.log('External service webhook plugin registered');
  } else {
    console.log('External service webhook plugin not configured - missing EXTERNAL_SERVICE_WEBHOOK_URL');
  }

  // Only register analytics plugin if analytics URL is configured
  if (process.env.ANALYTICS_SERVICE_WEBHOOK_URL) {
    const multiServicePlugin = new MultiServiceWebhookPlugin();
    pluginManager.registerPlugin(multiServicePlugin);
    console.log('Multi-service webhook plugin registered');
  } else {
    console.log('Multi-service webhook plugin not configured - missing ANALYTICS_SERVICE_WEBHOOK_URL');
  }
}

/**
 * Plugin configuration for different environments
 */
export function configurePluginsByEnvironment(pluginManager: PluginManagerService): void {
  const environment = process.env.NODE_ENV || 'development';

  switch (environment) {
    case 'production':
      // Production: Register all plugins with proper error handling
      try {
        const externalServicePlugin = new ExternalServiceWebhookPlugin();
        pluginManager.registerPlugin(externalServicePlugin);
        console.log('Production: External service webhook plugin registered');
      } catch (error) {
        console.error('Failed to register external service plugin:', error);
      }

      try {
        const multiServicePlugin = new MultiServiceWebhookPlugin();
        pluginManager.registerPlugin(multiServicePlugin);
        console.log('Production: Multi-service webhook plugin registered');
      } catch (error) {
        console.error('Failed to register multi-service plugin:', error);
      }
      break;

    case 'development':
      // Development: Register plugins only if URLs are configured
      if (process.env.EXTERNAL_SERVICE_WEBHOOK_URL) {
        const externalServicePlugin = new ExternalServiceWebhookPlugin();
        pluginManager.registerPlugin(externalServicePlugin);
        console.log('Development: External service webhook plugin registered');
      }

      if (process.env.ANALYTICS_SERVICE_WEBHOOK_URL) {
        const multiServicePlugin = new MultiServiceWebhookPlugin();
        pluginManager.registerPlugin(multiServicePlugin);
        console.log('Development: Multi-service webhook plugin registered');
      }
      break;

    case 'test':
      // Test: Don't register external plugins to avoid external calls during testing
      console.log('Test environment: External plugins not registered');
      break;

    default:
      console.log(`Unknown environment: ${environment}, no plugins registered`);
  }
}

/**
 * Example of how to use this in app.module.ts:
 * 
 * import { configurePlugins } from './modules/plugins/plugin-config';
 * 
 * @Module({
 *   imports: [...],
 *   providers: [
 *     PluginManagerService,
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: PluginInitializationInterceptor,
 *     },
 *   ],
 * })
 * export class AppModule {
 *   constructor(private pluginManager: PluginManagerService) {
 *     // Configure plugins on module initialization
 *     configurePlugins(this.pluginManager);
 *   }
 * }
 */ 