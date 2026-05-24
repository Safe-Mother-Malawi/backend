import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { NotificationType } from './entities/notification.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /** Admin/system can push a notification to any user */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.DHO, UserRole.CLINICIAN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  /**
   * Admin Broadcast Message Endpoints
   */

  /** Admin sends broadcast message to all system users */
  @Post('broadcast/all')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async broadcastToAll(
    @CurrentUser() user: User,
    @Body() dto: { title: string; body: string; type?: NotificationType },
  ) {
    return this.service.broadcastToAll(
      dto.title,
      dto.body,
      dto.type || NotificationType.INFO,
      user.id,
    );
  }

  /** Admin sends broadcast message to specific role */
  @Post('broadcast/role/:role')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async broadcastToRole(
    @CurrentUser() user: User,
    @Param('role') role: UserRole,
    @Body() dto: { title: string; body: string; type?: NotificationType },
  ) {
    return this.service.broadcastToRole(
      role,
      dto.title,
      dto.body,
      dto.type || NotificationType.INFO,
      user.id,
    );
  }

  /** Admin sends broadcast message to specific district */
  @Post('broadcast/district/:district')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async broadcastToDistrict(
    @CurrentUser() user: User,
    @Param('district') district: string,
    @Body() dto: { title: string; body: string; type?: NotificationType },
  ) {
    return this.service.broadcastToDistrict(
      district,
      dto.title,
      dto.body,
      dto.type || NotificationType.INFO,
      user.id,
    );
  }

  /** Admin sends broadcast message to specific users */
  @Post('broadcast/users')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async broadcastToUsers(
    @CurrentUser() user: User,
    @Body() dto: { userIds: string[]; title: string; body: string; type?: NotificationType },
  ) {
    return this.service.broadcastToUsers(
      dto.userIds,
      dto.title,
      dto.body,
      dto.type || NotificationType.INFO,
      user.id,
    );
  }

  /** Get broadcast history (admin only) */
  @Get('broadcast/history')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getBroadcastHistory(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.service.getBroadcastHistory(limit, offset);
  }

  /** Each user fetches their own notifications */
  @Get()
  findForUser(@CurrentUser() user: User) {
    return this.service.findForUser(user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.markRead(id, user.id);
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser() user: User) {
    return this.service.markAllRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.delete(id, user.id);
  }

  /**
   * Emergency Alert Endpoint (from patient app)
   */
  @Post('emergency')
  @Roles(UserRole.PRENATAL, UserRole.NEONATAL)
  @HttpCode(HttpStatus.OK)
  async triggerEmergency(
    @CurrentUser() user: User,
    @Body() dto: { latitude?: number; longitude?: number; details?: string },
  ) {
    const locString = (dto.latitude && dto.longitude) 
        ? `Location: ${dto.latitude}, ${dto.longitude}` 
        : 'Location: Not provided';
        
    const bodyText = `EMERGENCY ALERT triggered by ${user.fullName} (${user.phone}).\n${locString}\nDetails: ${dto.details || 'None'}`;
    
    // Notify all clinicians and DHOs
    await this.service.notifyClinicians('🚨 EMERGENCY SOS', bodyText, NotificationType.ALERT);
    await this.service.notifyDHOs('🚨 EMERGENCY SOS', bodyText, NotificationType.ALERT);

    return { success: true, message: 'Emergency alert dispatched to medical team.' };
  }
}
