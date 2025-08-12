import { Controller, Post, Get, Param, UseInterceptors, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';    
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';
import { AuthContext } from '@/common/interfaces/auth.interface';

@ApiTags('Configuration')
@Controller('config')
@UseInterceptors(AuthContextInterceptor)
export class ConfigController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get()
  @ApiOperation({ summary: 'Get LMS configuration' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async getConfig(
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    return this.configurationService.getConfig(
      authContext.tenantId,
    );
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync configuration from external service' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration synced successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid tenant ID' })
  @ApiResponse({ status: 500, description: 'Failed to sync configuration' })
  async syncTenantConfig(
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    return this.configurationService.syncTenantConfig(authContext.tenantId);
  }
} 