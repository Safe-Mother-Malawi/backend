import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { HealthCheckHistoryService } from './health-check-history.service';
import { CreateHealthCheckHistoryDto } from './dto/create-health-check-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('health-check-history')
export class HealthCheckHistoryController {
  constructor(private readonly service: HealthCheckHistoryService) {}

  /**
   * Create a new health check history record
   * Patients can create their own records
   * Clinicians can create on behalf of patients
   */
  @Post()
  @Roles(UserRole.PRENATAL, UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateHealthCheckHistoryDto,
    @CurrentUser() user: User,
  ) {
    if (user.role === UserRole.CLINICIAN || user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Staff must use the patient-specific endpoint.');
    }

    return this.service.create(dto, user);
  }

  /**
   * Create a health check history record for a specific patient.
   * Staff only; patient ownership is resolved from the route, never the body.
   */
  @Post('user/:userId')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createForUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateHealthCheckHistoryDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createForUser(userId, dto, user);
  }

  /**
   * Get health check history for the current user
   * Patients see their own history
   * Clinicians/DHO/Admin can query any user's history
   */
  @Get('my-history')
  @Roles(UserRole.PRENATAL, UserRole.NEONATAL, UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  async getMyHistory(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const { limit: limitNum, offset: offsetNum } = this.pagination(limit, offset);

    return this.service.findByUser(user.id, limitNum, offsetNum);
  }

  /**
   * Get the latest health check for a user
   */
  @Get('user/:userId/latest')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN, UserRole.PRENATAL, UserRole.NEONATAL)
  async getLatest(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findLatestForUser(userId, user);
  }

  /**
   * Get health check statistics for a user
   */
  @Get('user/:userId/statistics')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  async getStatistics(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.getStatistics(userId);
  }

  /**
   * Get health check history for a specific user
   * Clinicians/DHO/Admin can query any user's history
   */
  @Get('user/:userId')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN)
  async getUserHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const { limit: limitNum, offset: offsetNum } = this.pagination(limit, offset);

    return this.service.findByUser(userId, limitNum, offsetNum);
  }

  /**
   * Get a single health check record by ID
   */
  @Get(':id')
  @Roles(UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN, UserRole.PRENATAL, UserRole.NEONATAL)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findOneForUser(id, user);
  }

  /**
   * Get all health check records (admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const { limit: limitNum, offset: offsetNum } = this.pagination(limit, offset);

    return this.service.findAll(limitNum, offsetNum);
  }

  /**
   * Delete a health check record (admin only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(id);
  }

  private pagination(limit?: string, offset?: string): { limit: number; offset: number } {
    const parsedLimit = Number.parseInt(limit ?? '50', 10);
    const parsedOffset = Number.parseInt(offset ?? '0', 10);

    return {
      limit: Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50,
      offset: Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0,
    };
  }
}
