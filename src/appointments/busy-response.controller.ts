import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BusyResponseService } from './services/busy-response.service';
import { MarkBusyDto } from './dto/mark-busy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class BusyResponseController {
  constructor(private readonly busyResponseService: BusyResponseService) {}

  /**
   * Mark an appointment as busy (patient unavailable)
   * POST /appointments/:id/busy
   */
  @Post(':id/busy')
  @Roles(UserRole.PRENATAL, UserRole.NEONATAL)
  @HttpCode(HttpStatus.CREATED)
  async markAsBusy(
    @Param('id') appointmentId: string,
    @Body() dto: MarkBusyDto,
    @CurrentUser() user: User,
  ) {
    return this.busyResponseService.markAsBusy(appointmentId, user.id, dto);
  }

  /**
   * Get busy responses for an appointment
   * GET /appointments/:id/busy-responses
   */
  @Get(':id/busy-responses')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  async getBusyResponses(@Param('id') appointmentId: string) {
    return this.busyResponseService.findByAppointment(appointmentId);
  }

  /**
   * Get busy responses for current user
   * GET /appointments/busy-responses/my
   */
  @Get('busy-responses/my')
  @Roles(UserRole.PRENATAL, UserRole.NEONATAL)
  async getMyBusyResponses(@CurrentUser() user: User) {
    return this.busyResponseService.findByUser(user.id);
  }

  /**
   * Get busy response by ID
   * GET /appointments/busy-responses/:id
   */
  @Get('busy-responses/:id')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO, UserRole.PRENATAL, UserRole.NEONATAL)
  async getBusyResponse(@Param('id') id: string) {
    return this.busyResponseService.findById(id);
  }

  /**
   * Approve reschedule request
   * PUT /appointments/busy-responses/:id/approve
   */
  @Put('busy-responses/:id/approve')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.OK)
  async approveReschedule(
    @Param('id') busyResponseId: string,
    @Body() body: { newDate: string; newTime?: string },
  ) {
    return this.busyResponseService.approveReschedule(
      busyResponseId,
      body.newDate,
      body.newTime,
    );
  }

  /**
   * Reject reschedule request
   * PUT /appointments/busy-responses/:id/reject
   */
  @Put('busy-responses/:id/reject')
  @Roles(UserRole.CLINICIAN, UserRole.ADMIN, UserRole.DHO)
  @HttpCode(HttpStatus.OK)
  async rejectReschedule(
    @Param('id') busyResponseId: string,
    @Body() body: { reason: string },
  ) {
    await this.busyResponseService.rejectReschedule(busyResponseId, body.reason);
    return { message: 'Reschedule request rejected' };
  }

  /**
   * Get busy response statistics
   * GET /appointments/busy-responses/stats
   */
  @Get('busy-responses/stats')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  async getStatistics() {
    return this.busyResponseService.getStatistics();
  }
}
