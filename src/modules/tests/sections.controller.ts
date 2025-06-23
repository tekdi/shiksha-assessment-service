import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ApiSuccessResponseDto } from '@/common/dto/api-response.dto';
import { AuthContext } from '@/common/interfaces/auth.interface';

@ApiTags('Test Sections')
@ApiBearerAuth()
@Controller('tests/:testId/sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new section in a test' })
  @ApiResponse({ status: 201, description: 'Section created', type: ApiSuccessResponseDto })
  async create(
    @Param('testId') testId: string,
    @Body() createSectionDto: CreateSectionDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const section = await this.sectionsService.create({ ...createSectionDto, testId }, authContext);
    return { sectionId: section.id };
  }

  @Get()
  @ApiOperation({ summary: 'List all sections in a test' })
  @ApiResponse({ status: 200, description: 'Sections listed', type: ApiSuccessResponseDto })
  async findAll(@Param('testId') testId: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.sectionsService.findAll(testId, authContext);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a section by ID' })
  @ApiResponse({ status: 200, description: 'Section found', type: ApiSuccessResponseDto })
  async findOne(@Param('testId') testId: string, @Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    return this.sectionsService.findOne(id, authContext);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a section' })
  @ApiResponse({ status: 200, description: 'Section updated', type: ApiSuccessResponseDto })
  async update(
    @Param('testId') testId: string,
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
    @Req() req: any,
  ) {
    const authContext: AuthContext = req.user;
    const section = await this.sectionsService.update(id, updateSectionDto, authContext);
    return { sectionId: section.id };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiResponse({ status: 200, description: 'Section deleted', type: ApiSuccessResponseDto })
  async remove(@Param('testId') testId: string, @Param('id') id: string, @Req() req: any) {
    const authContext: AuthContext = req.user;
    await this.sectionsService.remove(id, authContext);
    return { message: 'Section deleted successfully' };
  }
} 