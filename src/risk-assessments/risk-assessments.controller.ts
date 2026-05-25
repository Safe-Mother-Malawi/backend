import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, BadRequestException, NotFoundException, ForbiddenException,
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
  findAll(@Query('limit') limit: number = 50, @Query('offset') offset: number = 0) {
    // Add pagination to prevent loading all records
    return this.service.findAll(limit, offset);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO, UserRole.PRENATAL, UserRole.NEONATAL)
  async findByPatient(@Param('patientId') patientId: string, @CurrentUser() user: User) {
    if (!patientId) throw new BadRequestException('Patient ID is required');
    
    // Verify patient exists
    const patient = await this.service.findByPatient(patientId);
    if (!patient || patient.length === 0) {
      throw new NotFoundException('No risk assessments found for this patient');
    }
    
    return patient;
  }

  @Get(':id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    if (!id) throw new BadRequestException('Assessment ID is required');
    
    const assessment = await this.service.findOne(id);
    
    // Verify clinician has access to this assessment
    if (user.role === UserRole.CLINICIAN && assessment.submittedBy?.id !== user.id) {
      throw new ForbiddenException('You do not have access to this assessment');
    }
    
    return assessment;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
