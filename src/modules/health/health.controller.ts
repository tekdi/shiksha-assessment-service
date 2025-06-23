import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    type: ApiSuccessResponseDto,
  })
  async checkHealth() {
    const healthStatus = await this.healthService.checkHealth();
    return healthStatus;
  }
} 