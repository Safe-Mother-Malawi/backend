import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  @Post()
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAlertDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user);
  }

  @Get('active')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  findActive(@CurrentUser() user: User) {
    return this.service.findActive(user);
  }

  @Get(':id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/attended')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  markAttended(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.markAttended(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
