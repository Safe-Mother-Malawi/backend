import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { DeviceToken } from './entities/device-token.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
    private readonly notificationsService: NotificationsService,
  ) {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        // Initialize with service account from environment
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT || '{}',
        );

        if (Object.keys(serviceAccount).length === 0) {
          this.logger.warn(
            'Firebase service account not configured. Push notifications will be disabled.',
          );
          return;
        }

        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.firebaseApp = admin.app();
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
    }
  }

  /**
   * Register a device token for a user
   */
  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
  ): Promise<DeviceToken> {
    // Check if token already exists for this user
    let deviceToken = await this.deviceTokenRepo.findOne({
      where: { userId, token: dto.token },
    });

    if (deviceToken) {
      // Update existing token
      deviceToken.isActive = true;
      deviceToken.platform = dto.platform || 'mobile';
      deviceToken.deviceName = dto.deviceName;
      return this.deviceTokenRepo.save(deviceToken);
    }

    // Create new token
    deviceToken = this.deviceTokenRepo.create({
      userId,
      token: dto.token,
      platform: dto.platform || 'mobile',
      deviceName: dto.deviceName,
      isActive: true,
    });

    return this.deviceTokenRepo.save(deviceToken);
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(userId: string, token: string): Promise<boolean> {
    const result = await this.deviceTokenRepo.delete({
      userId,
      token,
    });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Get all active device tokens for a user
   */
  async getUserDeviceTokens(userId: string): Promise<string[]> {
    const tokens = await this.deviceTokenRepo.find({
      where: { userId, isActive: true },
      select: ['token'],
    });
    return tokens.map((t) => t.token);
  }

  /**
   * Send push notification to a single user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokens = await this.getUserDeviceTokens(userId);

    if (tokens.length === 0) {
      this.logger.warn(`No active device tokens found for user ${userId}`);
      return;
    }

    await this.sendToTokens(tokens, title, body, data);

    // Also create a notification record
    await this.notificationsService.create({
      userId,
      title,
      body,
      type: NotificationType.INFO,
    });
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const allTokens: string[] = [];

    for (const userId of userIds) {
      const tokens = await this.getUserDeviceTokens(userId);
      allTokens.push(...tokens);
    }

    if (allTokens.length === 0) {
      this.logger.warn('No active device tokens found for any user');
      return;
    }

    await this.sendToTokens(allTokens, title, body, data);
  }

  /**
   * Send push notification to specific tokens
   */
  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return;
    }

    if (tokens.length === 0) {
      return;
    }

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            title,
            body,
            icon: '/logo/app-icon.png',
          },
        },
      };

      // Send to multiple tokens
      const response = await admin.messaging().sendMulticast({
        ...message,
        tokens,
      });

      this.logger.log(
        `Push notification sent: ${response.successCount} successful, ${response.failureCount} failed`,
      );

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });

        // Deactivate failed tokens
        await this.deactivateTokens(failedTokens);
      }
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
    }
  }

  /**
   * Send notification to all users of a specific role
   */
  async sendToRole(
    role: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    // This would require access to users repository
    // Implementation depends on your user structure
    this.logger.log(`Sending notification to role: ${role}`);
  }

  /**
   * Deactivate invalid tokens
   */
  private async deactivateTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;

    await this.deviceTokenRepo.update(
      { token: tokens as any },
      { isActive: false },
    );

    this.logger.log(`Deactivated ${tokens.length} invalid tokens`);
  }

  /**
   * Clean up old inactive tokens (older than 30 days)
   */
  async cleanupOldTokens(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.deviceTokenRepo.delete({
      isActive: false,
      updatedAt: thirtyDaysAgo as any,
    });

    this.logger.log(`Cleaned up ${result.affected ?? 0} old tokens`);
  }

  /**
   * Get device token statistics
   */
  async getStatistics(): Promise<{
    totalTokens: number;
    activeTokens: number;
    inactiveTokens: number;
    byPlatform: Record<string, number>;
  }> {
    const totalTokens = await this.deviceTokenRepo.count();
    const activeTokens = await this.deviceTokenRepo.count({
      where: { isActive: true },
    });
    const inactiveTokens = totalTokens - activeTokens;

    // Count by platform
    const byPlatform = await this.deviceTokenRepo
      .createQueryBuilder('dt')
      .select('dt.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dt.platform')
      .getRawMany();

    const platformStats: Record<string, number> = {};
    byPlatform.forEach((row) => {
      platformStats[row.platform] = parseInt(row.count, 10);
    });

    return {
      totalTokens,
      activeTokens,
      inactiveTokens,
      byPlatform: platformStats,
    };
  }
}
