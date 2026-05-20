import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateFeedingLogDto } from './dto/create-feeding-log.dto';
import { CreateSleepLogDto } from './dto/create-sleep-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tracking')
export class TrackingController {
  constructor(private readonly service: TrackingService) {}

  // ── Feeding ───────────────────────────────────────────────────────────────

  @Post('feeding')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  logFeeding(@Body() dto: CreateFeedingLogDto) {
    return this.service.logFeeding(dto);
  }

  @Get('feeding/:neonatalPatientId')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  getFeedingLogs(@Param('neonatalPatientId') id: string) {
    return this.service.getFeedingLogs(id);
  }

  @Get('feeding/:neonatalPatientId/today')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN)
  getTodayFeedingLogs(@Param('neonatalPatientId') id: string) {
    return this.service.getTodayFeedingLogs(id);
  }

  @Delete('feeding/:id')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFeedingLog(@Param('id') id: string) {
    return this.service.deleteFeedingLog(id);
  }

  // ── Sleep ─────────────────────────────────────────────────────────────────

  @Post('sleep')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  logSleep(@Body() dto: CreateSleepLogDto) {
    return this.service.logSleep(dto);
  }

  @Get('sleep/:neonatalPatientId')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  getSleepLogs(@Param('neonatalPatientId') id: string) {
    return this.service.getSleepLogs(id);
  }

  @Get('sleep/:neonatalPatientId/today')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN)
  getTodaySleepLogs(@Param('neonatalPatientId') id: string) {
    return this.service.getTodaySleepLogs(id);
  }

  @Delete('sleep/:id')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSleepLog(@Param('id') id: string) {
    return this.service.deleteSleepLog(id);
  }

  // ── Vaccines ──────────────────────────────────────────────────────────────

  @Get('vaccines/:neonatalPatientId')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  getVaccines(@Param('neonatalPatientId') id: string) {
    return this.service.getVaccines(id);
  }

  @Patch('vaccines/:neonatalPatientId')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN)
  async toggleVaccineStatus(
    @Param('neonatalPatientId') id: string,
    @Body() body: { name: string; given: boolean },
  ) {
    return this.service.toggleVaccineStatus(id, body.name, body.given);
  }

  @Get('vaccines/:neonatalPatientId/next')
  @Roles(UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN)
  getNextVaccine(@Param('neonatalPatientId') id: string) {
    return this.service.getNextVaccine(id);
  }
}
