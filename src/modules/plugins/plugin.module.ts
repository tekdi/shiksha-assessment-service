import { Module } from '@nestjs/common';
import { PluginManagerService } from '@/common/services/plugin-manager.service';

@Module({
  providers: [PluginManagerService],
  exports: [PluginManagerService],
})
export class PluginModule {} 