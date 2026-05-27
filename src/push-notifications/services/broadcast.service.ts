import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { PushNotificationsService } from '../push-notifications.service';
import { SendBroadcastDto } from '../dto/send-broadcast.dto';
import { NotificationType } from '../enums/notification-type.enum';

export interface BroadcastResult {
  success: boolean;
  message: string;
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
  timestamp: Date;
}

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  /**
   * Send broadcast to all users
   */
  async sendBroadcastToAll(dto: SendBroadcastDto): Promise<BroadcastResult> {
    try {
      this.logger.log('Sending broadcast to all users...');

      // Get all active users
      const users = await this.userRepo.find({
        where: { isActive: true },
        select: ['id'],
      });

      if (users.length === 0) {
        throw new BadRequestException('No active users found');
      }

      const userIds = users.map((u) => u.id);

      return await this.sendBroadcastToUsers(userIds, dto);
    } catch (error) {
      this.logger.error('Error sending broadcast to all users:', error);
      throw error;
    }
  }

  /**
   * Send broadcast to users by role
   * Supported roles:
   * - 'prenatal' - Prenatal mobile users
   * - 'neonatal' - Neonatal mobile users
   * - 'mobile-users' - All mobile users (prenatal + neonatal)
   * - 'clinician' - Clinicians
   * - 'dho' - District Health Officers
   * - 'admin' - Administrators
   * - 'all-staff' - All staff (clinician + dho + admin)
   * - 'patient' - All mobile users (legacy, same as mobile-users)
   */
  async sendBroadcastByRole(
    role: 'prenatal' | 'neonatal' | 'mobile-users' | 'clinician' | 'dho' | 'admin' | 'all-staff' | 'patient',
    dto: SendBroadcastDto,
  ): Promise<BroadcastResult> {
    try {
      this.logger.log(`Sending broadcast to ${role} users...`);

      let users: User[] = [];

      if (role === 'prenatal') {
        // Get prenatal mobile users only
        users = await this.userRepo.find({
          where: { role: UserRole.PRENATAL, isActive: true },
          select: ['id'],
        });
      } else if (role === 'neonatal') {
        // Get neonatal mobile users only
        users = await this.userRepo.find({
          where: { role: UserRole.NEONATAL, isActive: true },
          select: ['id'],
        });
      } else if (role === 'mobile-users' || role === 'patient') {
        // Get all mobile users (prenatal + neonatal)
        users = await this.userRepo.find({
          where: [
            { role: UserRole.PRENATAL, isActive: true },
            { role: UserRole.NEONATAL, isActive: true },
          ],
          select: ['id'],
        });
      } else if (role === 'clinician') {
        // Get clinicians only
        users = await this.userRepo.find({
          where: { role: UserRole.CLINICIAN, isActive: true },
          select: ['id'],
        });
      } else if (role === 'dho') {
        // Get DHOs only
        users = await this.userRepo.find({
          where: { role: UserRole.DHO, isActive: true },
          select: ['id'],
        });
      } else if (role === 'admin') {
        // Get admins only
        users = await this.userRepo.find({
          where: { role: UserRole.ADMIN, isActive: true },
          select: ['id'],
        });
      } else if (role === 'all-staff') {
        // Get all staff (clinician + dho + admin)
        users = await this.userRepo.find({
          where: [
            { role: UserRole.CLINICIAN, isActive: true },
            { role: UserRole.DHO, isActive: true },
            { role: UserRole.ADMIN, isActive: true },
          ],
          select: ['id'],
        });
      } else {
        throw new BadRequestException(`Invalid role: ${role}`);
      }

      if (users.length === 0) {
        throw new BadRequestException(`No active ${role} users found`);
      }

      const userIds = users.map((u) => u.id);

      return await this.sendBroadcastToUsers(userIds, dto);
    } catch (error) {
      this.logger.error(`Error sending broadcast to ${role} users:`, error);
      throw error;
    }
  }

  /**
   * Send broadcast to users by district
   */
  async sendBroadcastByDistrict(
    district: string,
    dto: SendBroadcastDto,
  ): Promise<BroadcastResult> {
    try {
      this.logger.log(`Sending broadcast to district ${district} users...`);

      // Get users by district
      const users = await this.userRepo.find({
        where: { district: district, isActive: true },
        select: ['id'],
      });

      if (users.length === 0) {
        throw new BadRequestException(
          `No active users found for district ${district}`,
        );
      }

      const userIds = users.map((u) => u.id);

      return await this.sendBroadcastToUsers(userIds, dto);
    } catch (error) {
      this.logger.error(
        `Error sending broadcast to district ${district} users:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all available districts
   */
  async getAvailableDistricts(): Promise<string[]> {
    try {
      const districts = await this.userRepo
        .createQueryBuilder('user')
        .select('DISTINCT user.district', 'district')
        .where('user.district IS NOT NULL')
        .where('user.isActive = :isActive', { isActive: true })
        .orderBy('user.district', 'ASC')
        .getRawMany();

      return districts.map((d) => d.district).filter((d) => d);
    } catch (error) {
      this.logger.error('Error getting available districts:', error);
      throw error;
    }
  }

  /**
   * Send broadcast to users by facility
   */
  async sendBroadcastByFacility(
    facilityId: string,
    dto: SendBroadcastDto,
  ): Promise<BroadcastResult> {
    try {
      this.logger.log(`Sending broadcast to facility ${facilityId} users...`);

      // Get users by facility
      const users = await this.userRepo.find({
        where: { facility: facilityId, isActive: true },
        select: ['id'],
      });

      if (users.length === 0) {
        throw new BadRequestException(
          `No active users found for facility ${facilityId}`,
        );
      }

      const userIds = users.map((u) => u.id);

      return await this.sendBroadcastToUsers(userIds, dto);
    } catch (error) {
      this.logger.error(
        `Error sending broadcast to facility ${facilityId} users:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send broadcast to specific users
   */
  async sendBroadcastToUsers(
    userIds: string[],
    dto: SendBroadcastDto,
  ): Promise<BroadcastResult> {
    try {
      if (!userIds || userIds.length === 0) {
        throw new BadRequestException('No user IDs provided');
      }

      this.logger.log(`Sending broadcast to ${userIds.length} users...`);

      const startTime = Date.now();
      let sentCount = 0;
      let failedCount = 0;

      // Send to each user
      for (const userId of userIds) {
        try {
          await this.pushNotificationsService.sendToUser(
            userId,
            dto.title,
            dto.body,
            {
              type: dto.type || NotificationType.INFO,
              action: 'view_broadcast',
              timestamp: new Date().toISOString(),
            },
          );
          sentCount++;
        } catch (error) {
          this.logger.warn(`Failed to send broadcast to user ${userId}:`, error);
          failedCount++;
        }
      }

      const duration = Date.now() - startTime;

      this.logger.log(
        `Broadcast sent: ${sentCount} successful, ${failedCount} failed (${duration}ms)`,
      );

      return {
        success: true,
        message: `Broadcast sent to ${sentCount} users`,
        recipientsCount: userIds.length,
        sentCount,
        failedCount,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error sending broadcast to users:', error);
      throw error;
    }
  }

  /**
   * Send broadcast to single user
   */
  async sendBroadcastToUser(
    userId: string,
    dto: SendBroadcastDto,
  ): Promise<BroadcastResult> {
    try {
      this.logger.log(`Sending broadcast to user ${userId}...`);

      // Verify user exists
      const user = await this.userRepo.findOne({
        where: { id: userId, isActive: true },
      });

      if (!user) {
        throw new BadRequestException(`User ${userId} not found or inactive`);
      }

      await this.pushNotificationsService.sendToUser(
        userId,
        dto.title,
        dto.body,
        {
          type: dto.type || NotificationType.INFO,
          action: 'view_broadcast',
          timestamp: new Date().toISOString(),
        },
      );

      this.logger.log(`Broadcast sent to user ${userId}`);

      return {
        success: true,
        message: `Broadcast sent to user ${user.email}`,
        recipientsCount: 1,
        sentCount: 1,
        failedCount: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error sending broadcast to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get broadcast statistics
   */
  async getBroadcastStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
    usersByFacility: Record<string, number>;
  }> {
    try {
      const totalUsers = await this.userRepo.count();
      const activeUsers = await this.userRepo.count({
        where: { isActive: true },
      });

      // Count by role
      const roleStats = await this.userRepo
        .createQueryBuilder('user')
        .select('user.role', 'role')
        .addSelect('COUNT(*)', 'count')
        .where('user.isActive = :isActive', { isActive: true })
        .groupBy('user.role')
        .getRawMany();

      const usersByRole: Record<string, number> = {};
      roleStats.forEach((stat) => {
        usersByRole[stat.role] = parseInt(stat.count, 10);
      });

      // Count by facility
      const facilityStats = await this.userRepo
        .createQueryBuilder('user')
        .select('user.facility', 'facility')
        .addSelect('COUNT(*)', 'count')
        .where('user.isActive = :isActive', { isActive: true })
        .groupBy('user.facility')
        .getRawMany();

      const usersByFacility: Record<string, number> = {};
      facilityStats.forEach((stat) => {
        if (stat.facility) {
          usersByFacility[stat.facility] = parseInt(stat.count, 10);
        }
      });

      return {
        totalUsers,
        activeUsers,
        usersByRole,
        usersByFacility,
      };
    } catch (error) {
      this.logger.error('Error getting broadcast statistics:', error);
      throw error;
    }
  }
}
