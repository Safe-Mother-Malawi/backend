import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus } from './entities/appointment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { IsEnum } from 'class-validator';

class UpdateStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO, UserRole.PRENATAL, UserRole.NEONATAL)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO, UserRole.PRENATAL, UserRole.NEONATAL)
  findAll(
    @Query('clinicianId') clinicianId?: string,
    @Query('date') date?: string,
    @Query('upcoming') upcoming?: string,
    @CurrentUser() user?: User,
  ) {
    // Clinicians auto-filter to their own appointments
    const effectiveClinicianId =
      user?.role === UserRole.CLINICIAN ? user.id : clinicianId;

    return this.service.findFiltered({
      clinicianId: effectiveClinicianId,
      date,
      upcoming: upcoming === 'true',
    });
  }

  /**
   * GET /appointments/mine?prenatalPatientId=xxx  OR  ?neonatalPatientId=xxx
   * Mobile users fetch their own appointments by their linked patient record ID.
   */
  @Get('mine')
  @Roles(UserRole.PRENATAL, UserRole.NEONATAL)
  findMine(
    @Query('prenatalPatientId') prenatalId?: string,
    @Query('neonatalPatientId') neonatalId?: string,
  ) {
    return this.service.findByPatient(prenatalId, neonatalId);
  }

  @Get('patient')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO, UserRole.PRENATAL, UserRole.NEONATAL)
  findByPatient(
    @Query('prenatalId') prenatalId?: string,
    @Query('neonatalId') neonatalId?: string,
  ) {
    return this.service.findByPatient(prenatalId, neonatalId);
  }

  @Get(':id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO, UserRole.PRENATAL, UserRole.NEONATAL)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO, UserRole.PRENATAL, UserRole.NEONATAL)
  update(@Param('id') id: string, @Body() dto: Partial<CreateAppointmentDto>) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO, UserRole.PRENATAL, UserRole.NEONATAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
