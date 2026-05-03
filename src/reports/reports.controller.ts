import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.CREATED)
  generate(@Body() dto: GenerateReportDto, @CurrentUser() user: User) {
    return this.service.generate(dto, user);
  }

  /** Export audit/system data in CSV, JSON, Excel or PDF */
  @Get('export')
  @Roles(UserRole.ADMIN)
  async exportData(
    @Res() res: Response,
    @Query('format') format = 'CSV',
    @Query('dataType') dataType = 'All Data',
    @Query('district') district?: string,
    @Query('dateRange') dateRange = 'Last 30 days',
  ) {
    const { buffer, filename, mimeType } = await this.service.exportData({ format, dataType, district, dateRange });
    const safeFilename = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\\r\n]/g, '_');
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DHO)
  findAll(
    @CurrentUser() user: User,
    @Query('district') district?: string,
  ) {
    return this.service.findAll(user, district);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/pdf')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.service.generatePdf(id);
    const safeFilename = filename
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/["\\\r\n]/g, '_');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Patch(':id/archive')
  @Roles(UserRole.ADMIN)
  archive(@Param('id') id: string) {
    return this.service.archive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.delete(id, user);
  }
}
