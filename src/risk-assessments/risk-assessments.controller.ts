import {
  Controller, Get, Post, Delete, Body, Param,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RiskAssessmentsService } from './risk-assessments.service';
import { CreateRiskAssessmentDto } from './dto/create-risk-assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('risk-assessments')
export class RiskAssessmentsController {
  constructor(private readonly service: RiskAssessmentsService) {}

  @Post()
  @Roles(UserRole.CLINICIAN, UserRole.PRENATAL, UserRole.NEONATAL, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRiskAssessmentDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  findAll() {
    return this.service.findAll();
  }

  @Get('patient/:patientId')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO, UserRole.PRENATAL, UserRole.NEONATAL)
  findByPatient(@Param('patientId') patientId: string) {
    return this.service.findByPatient(patientId);
  }

  @Get(':id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
