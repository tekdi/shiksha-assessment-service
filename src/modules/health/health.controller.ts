import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Health check response',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'api.content.health' },
        ver: { type: 'string', example: '3.0' },
        ts: { type: 'string', example: '2023-11-02T10:33:23.321Z' },
        params: {
          type: 'object',
          properties: {
            resmsgid: { type: 'string', example: '3fc21690-796b-11ee-aa52-8d96a90bc246' },
            msgid: { type: 'string', nullable: true, example: null },
            err: { type: 'string', nullable: true, example: null },
            status: { type: 'string', example: 'successful' },
            errmsg: { type: 'string', nullable: true, example: null },
          },
        },
        responseCode: { type: 'string', example: 'OK' },
        result: {
          type: 'object',
          properties: {
            checks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'postgresql' },
                  healthy: { type: 'boolean', example: true },
                },
              },
            },
            healthy: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Health check failed',
  })
  async checkHealth() {
    return await this.healthService.checkHealth();
  }

  @Get('healthz')
  @ApiOperation({ summary: 'Health check endpoint (alternative)' })
  @ApiResponse({
    status: 200,
    description: 'Health check response',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'api.content.health' },
        ver: { type: 'string', example: '3.0' },
        ts: { type: 'string', example: '2023-11-02T10:33:23.321Z' },
        params: {
          type: 'object',
          properties: {
            resmsgid: { type: 'string', example: '3fc21690-796b-11ee-aa52-8d96a90bc246' },
            msgid: { type: 'string', nullable: true, example: null },
            err: { type: 'string', nullable: true, example: null },
            status: { type: 'string', example: 'successful' },
            errmsg: { type: 'string', nullable: true, example: null },
          },
        },
        responseCode: { type: 'string', example: 'OK' },
        result: {
          type: 'object',
          properties: {
            checks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'postgresql' },
                  healthy: { type: 'boolean', example: true },
                },
              },
            },
            healthy: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Health check failed',
  })
  async checkHealthz() {
    return await this.healthService.checkHealth();
  }
} 