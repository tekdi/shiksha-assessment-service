import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ConfigController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    HttpModule, 
    ConfigModule, 
    CacheModule
  ],
  controllers: [ConfigController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {} 