import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePrenatalDto } from './dto/create-prenatal.dto';
import { CreateNeonatalDto } from './dto/create-neonatal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // ── Mobile: fetch own linked patient record ───────────────────────────────

  /**
   * GET /patients/me/prenatal
   * Prenatal mobile user fetches their own linked patient record.
   */
  @Get('me/prenatal')
  @Roles(UserRole.PRENATAL)
  async getMyPrenatalRecord(@CurrentUser() user: User) {
    const record = await this.patientsService.getMyPrenatalRecord(user.id);
    if (!record) throw new NotFoundException('No linked prenatal record found. Please contact your clinician.');
    return record;
  }

  /**
   * GET /patients/me/neonatal
   * Neonatal mobile user fetches their own linked patient record.
   */
  @Get('me/neonatal')
  @Roles(UserRole.NEONATAL)
  async getMyNeonatalRecord(@CurrentUser() user: User) {
    const record = await this.patientsService.getMyNeonatalRecord(user.id);
    if (!record) throw new NotFoundException('No linked neonatal record found. Please contact your clinician.');
    return record;
  }

  // ── Prenatal CRUD (clinician / admin / DHO) ───────────────────────────────

  @Post('prenatal')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.CREATED)
  createPrenatal(@Body() dto: CreatePrenatalDto, @CurrentUser() user: User) {
    return this.patientsService.createPrenatal(dto, user);
  }

  @Get('prenatal')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  findAllPrenatal(@CurrentUser() user: User, @Query('search') search?: string) {
    if (!user) throw new UnauthorizedException('User not authenticated');
    return this.patientsService.findAllPrenatal(user, search);
  }

  @Get('prenatal/:id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  async findOnePrenatal(@Param('id') id: string, @CurrentUser() user: User) {
    if (!user) throw new UnauthorizedException('User not authenticated');
    if (!id) throw new BadRequestException('Patient ID is required');
    
    const patient = await this.patientsService.findOnePrenatal(id, user.id);
    
    // Verify clinician has access to this patient
    if (user.role === UserRole.CLINICIAN && patient.clinicianId !== user.id) {
      throw new ForbiddenException('You do not have access to this patient record');
    }
    
    return patient;
  }

  @Get('prenatal/:id/history')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  async getPrenatalHistory(@Param('id') id: string, @CurrentUser() user: User) {
    if (!user) throw new UnauthorizedException('User not authenticated');
    if (!id) throw new BadRequestException('Patient ID is required');
    
    const patient = await this.patientsService.findOnePrenatal(id, user.id);
    
    // Verify clinician has access to this patient
    if (user.role === UserRole.CLINICIAN && patient.clinicianId !== user.id) {
      throw new ForbiddenException('You do not have access to this patient record');
    }
    
    return this.patientsService.getPatientHistory(id);
  }

  @Put('prenatal/:id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  updatePrenatal(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePrenatalDto>,
    @CurrentUser() user: User,
  ) {
    return this.patientsService.updatePrenatal(id, dto, user.id);
  }

  @Patch('prenatal/:id/password')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  async resetPrenatalPassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }
    await this.patientsService.resetPrenatalPassword(id, password);
    return { success: true, message: 'Mobile account password updated.' };
  }

  @Delete('prenatal/:id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePrenatal(@Param('id') id: string, @CurrentUser() user: User) {
    return this.patientsService.deletePrenatal(id, user.id);
  }

  // ── Neonatal CRUD (clinician / admin / DHO) ───────────────────────────────

  @Post('neonatal')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.CREATED)
  createNeonatal(@Body() dto: CreateNeonatalDto, @CurrentUser() user: User) {
    return this.patientsService.createNeonatal(dto, user);
  }

  @Get('neonatal')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  findAllNeonatal(@CurrentUser() user: User, @Query('search') search?: string) {
    return this.patientsService.findAllNeonatal(user, search);
  }

  @Get('neonatal/:id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  findOneNeonatal(@Param('id') id: string, @CurrentUser() user: User) {
    return this.patientsService.findOneNeonatal(id, user.id);
  }

  @Get('neonatal/:id/history')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  getNeonatalHistory(@Param('id') id: string) {
    return this.patientsService.getPatientHistory(id);
  }

  @Put('neonatal/:id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  updateNeonatal(
    @Param('id') id: string,
    @Body() dto: Partial<CreateNeonatalDto>,
    @CurrentUser() user: User,
  ) {
    return this.patientsService.updateNeonatal(id, dto, user.id);
  }

  @Delete('neonatal/:id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNeonatal(@Param('id') id: string, @CurrentUser() user: User) {
    return this.patientsService.deleteNeonatal(id, user.id);
  }
}
