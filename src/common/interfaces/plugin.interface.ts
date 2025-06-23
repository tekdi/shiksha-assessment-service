export interface PluginContext {
  tenantId: string;
  organisationId: string;
  userId: string;
  [key: string]: any;
}

export interface PluginEvent {
  name: string;
  context: PluginContext;
  data?: any;
  result?: any;
  timestamp?: string;
  id?: string;
}

export interface PluginHook {
  name: string;
  priority: number;
  handler: (event: PluginEvent) => Promise<void> | void;
}

export interface WebhookConfig {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  events?: string[];
}

export interface ExternalServiceConfig {
  type: 'webhook' | 'message-queue' | 'event-stream';
  webhook?: WebhookConfig;
  queue?: {
    name: string;
    exchange?: string;
    routingKey?: string;
  };
  stream?: {
    topic: string;
    partition?: number;
  };
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  isActive: boolean;
  hooks: PluginHook[];
  settings?: Record<string, any>;
  externalService?: ExternalServiceConfig;
  type?: 'internal' | 'external';
}

export interface PluginManager {
  registerPlugin(plugin: Plugin): void;
  unregisterPlugin(pluginId: string): void;
  triggerEvent(eventName: string, context: PluginContext, data?: any): Promise<PluginEvent>;
  getActivePlugins(): Plugin[];
  getPlugin(pluginId: string): Plugin | undefined;
  registerExternalService(config: ExternalServiceConfig): void;
  unregisterExternalService(serviceId: string): void;
} 