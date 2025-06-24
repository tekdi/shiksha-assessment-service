import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';
import { AuthContextInterceptor } from '@/common/interceptors/auth-context.interceptor';

@ApiTags('Test Sections')
@ApiBearerAuth()
@Controller('sections')
@UseInterceptors(AuthContextInterceptor)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}
  
  @Post()
  @ApiOperation({ summary: 'Create a new section' })
  @ApiResponse({ status: 201, description: 'Section created', type: ApiSuccessResponseDto })
  async create(
    @Body() createSectionDto: CreateSectionDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const section = await this.sectionsService.create(createSectionDto, authContext);
    return { sectionId: section.sectionId };
  }

  @Get()
  @ApiOperation({ summary: 'List all sections' })
  @ApiResponse({ status: 200, description: 'Sections listed', type: ApiSuccessResponseDto })
  async findAll(@Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.sectionsService.findAll(authContext);
  }

  @Get('test/:testId')
  @ApiOperation({ summary: 'List all sections for a specific test' })
  @ApiResponse({ status: 200, description: 'Sections listed for test', type: ApiSuccessResponseDto })
  async findByTestId(@Param('testId') testId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.sectionsService.findByTestId(testId, authContext);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a section by ID' })
  @ApiResponse({ status: 200, description: 'Section found', type: ApiSuccessResponseDto })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.sectionsService.findOne(id, authContext);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a section' })
  @ApiResponse({ status: 200, description: 'Section updated', type: ApiSuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const section = await this.sectionsService.update(id, updateSectionDto, authContext);
    return { sectionId: section.sectionId };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiResponse({ status: 200, description: 'Section deleted', type: ApiSuccessResponseDto })
  async remove(@Param('id') id: string, 
  @Query('hard') hardDelete: string, // expects 'true' as a string
  @Req() req: any) {
    const authContext: AuthContext = req.user;
    const isHardDelete = hardDelete === 'true';
    await this.sectionsService.remove(id, authContext, isHardDelete);
    return { message: 'Section deleted successfully' };
  }
} 