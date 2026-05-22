import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PushNotificationsService } from './push-notifications.service';
import { BroadcastService } from './services/broadcast.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { SendBroadcastDto } from './dto/send-broadcast.dto';

@Controller('push-notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(
    private readonly service: PushNotificationsService,
    private readonly broadcastService: BroadcastService,
  ) {}

  /**
   * Register a device token for push notifications
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    @CurrentUser() user: User,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.service.registerDevice(user.id, dto);
  }

  /**
   * Unregister a device token
   */
  @Delete('unregister/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterDevice(
    @CurrentUser() user: User,
    @Param('token') token: string,
  ) {
    await this.service.unregisterDevice(user.id, token);
  }

  /**
   * Get all device tokens for current user
   */
  @Get('devices')
  async getUserDevices(@CurrentUser() user: User) {
    const tokens = await this.service.getUserDeviceTokens(user.id);
    return {
      count: tokens.length,
      tokens,
    };
  }

  /**
   * Get push notification statistics (admin only)
   */
  @Get('statistics')
  async getStatistics() {
    return this.service.getStatistics();
  }

  /**
   * Send broadcast to all users (admin only)
   */
  @Post('broadcast/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async sendBroadcastToAll(
    @CurrentUser() user: User,
    @Body() dto: SendBroadcastDto,
  ) {
    return this.broadcastService.sendBroadcastToAll(dto);
  }

  /**
   * Send broadcast to users by role (admin only)
   */
  @Post('broadcast/role/:role')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async sendBroadcastByRole(
    @CurrentUser() user: User,
    @Param('role') role: 'patient' | 'clinician' | 'admin',
    @Body() dto: SendBroadcastDto,
  ) {
    return this.broadcastService.sendBroadcastByRole(role, dto);
  }

  /**
   * Send broadcast to users by facility (admin only)
   */
  @Post('broadcast/facility/:facilityId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async sendBroadcastByFacility(
    @CurrentUser() user: User,
    @Param('facilityId') facilityId: string,
    @Body() dto: SendBroadcastDto,
  ) {
    return this.broadcastService.sendBroadcastByFacility(facilityId, dto);
  }

  /**
   * Send broadcast to specific users (admin only)
   */
  @Post('broadcast/users')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async sendBroadcastToUsers(
    @CurrentUser() user: User,
    @Body() dto: SendBroadcastDto,
  ) {
    if (!dto.userIds || dto.userIds.length === 0) {
      throw new Error('No user IDs provided');
    }
    return this.broadcastService.sendBroadcastToUsers(dto.userIds, dto);
  }

  /**
   * Send broadcast to single user (admin only)
   */
  @Post('broadcast/user/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async sendBroadcastToUser(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
    @Body() dto: SendBroadcastDto,
  ) {
    return this.broadcastService.sendBroadcastToUser(userId, dto);
  }

  /**
   * Get broadcast statistics (admin only)
   */
  @Get('broadcast/stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getBroadcastStats() {
    return this.broadcastService.getBroadcastStats();
  }
}
