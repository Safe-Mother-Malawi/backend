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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PushNotificationsService } from './push-notifications.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller('push-notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(private readonly service: PushNotificationsService) {}

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
}
