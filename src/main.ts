// Polyfill for global crypto (Node.js v18+ should have this, but some tools may not expose it)
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.crypto = require('crypto');
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { ConfigurationService } from './modules/configuration/configuration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  const apiPrefix = process.env.ASSESSMENT_PREFIX || 'assessment/v1';
  app.setGlobalPrefix(apiPrefix);
  console.log(`🔧 API prefix configured as: ${apiPrefix}`);

  // Global exception filter
  app.useGlobalFilters(new ApiExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors();

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Assessment Service API')
    .setDescription('API for managing assessments, questions, and test-taking workflows')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addGlobalParameters(
      {
        name: 'tenantId',
        in: 'header',
        required: true,
        description: 'Tenant ID for multi-tenancy',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
      {
        name: 'organisationId',
        in: 'header',
        required: true,
        description: 'Organisation ID for multi-tenancy',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
      {
        name: 'userId',
        in: 'header',
        required: true,
        description: 'User ID for audit trail',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configurationService = app.get(ConfigurationService);
  await configurationService.syncTenantConfig(process.env.TENANT_ID || "");


  const port = process.env.PORT || 6000;
  await app.listen(port);
  
  console.log(`🚀 Assessment Service is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation available at: http://localhost:${port}/api`);
}

bootstrap(); 