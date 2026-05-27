import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType } from './entities/notification.entity';
import { BroadcastMessage, BroadcastStatus } from './entities/broadcast-message.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(BroadcastMessage)
    private readonly broadcastRepo: Repository<BroadcastMessage>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @Inject(forwardRef(() => PushNotificationsService))
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = this.repo.create(dto);
    return this.repo.save(notif);
  }

  /** Broadcast a notification to multiple users (In-App only) */
  async broadcast(
    userIds: string[],
    title: string,
    body: string,
    type: NotificationType = NotificationType.INFO,
  ): Promise<void> {
    if (userIds.length === 0) return;
    const notifs = userIds.map((userId) =>
      this.repo.create({ userId, title, body, type }),
    );
    await this.repo.save(notifs);
  }

  /** Notify all users of a given role. */
  async notifyRole(
    role: UserRole,
    title: string,
    body: string,
    type: NotificationType = NotificationType.INFO,
  ): Promise<void> {
    const users = await this.usersRepo.find({ where: { role, isActive: true } });
    const ids = users.map((u) => u.id);
    await this.broadcast(ids, title, body, type);
  }

  async notifyDHOs(title: string, body: string, type = NotificationType.INFO): Promise<void> {
    return this.notifyRole(UserRole.DHO, title, body, type);
  }

  async notifyClinicians(title: string, body: string, type = NotificationType.INFO): Promise<void> {
    return this.notifyRole(UserRole.CLINICIAN, title, body, type);
  }

  async notifyAdmins(title: string, body: string, type = NotificationType.INFO): Promise<void> {
    return this.notifyRole(UserRole.ADMIN, title, body, type);
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.repo.findOne({ where: { id, userId } });
    if (!notif) throw new NotFoundException('Notification not found.');
    notif.read = true;
    return this.repo.save(notif);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, read: false }, { read: true });
  }

  async delete(id: string, userId: string): Promise<void> {
    const notif = await this.repo.findOne({ where: { id, userId } });
    if (!notif) throw new NotFoundException('Notification not found.');
    await this.repo.remove(notif);
  }

  /**
   * New Broadcast Messaging endpoints (Scheduling and multiple channels)
   */

  async createBroadcast(dto: CreateBroadcastDto, adminId: string): Promise<BroadcastMessage> {
    const broadcast = this.broadcastRepo.create({
      title: dto.title,
      body: dto.body,
      type: dto.type || NotificationType.INFO,
      broadcastType: dto.broadcastType,
      targetRole: dto.targetRole,
      targetDistrict: dto.targetDistrict,
      targetFacilityId: dto.targetFacilityId,
      targetUserIds: dto.targetUserIds,
      deliveryChannels: dto.deliveryChannels || ['in-app'],
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      status: BroadcastStatus.PENDING,
      sentBy: adminId,
    });

    await this.broadcastRepo.save(broadcast);

    // If it's scheduled for the past or has no scheduled date, trigger send immediately
    if (!broadcast.scheduledAt || broadcast.scheduledAt <= new Date()) {
      await this.processBroadcast(broadcast.id);
    }

    return this.broadcastRepo.findOne({ where: { id: broadcast.id } });
  }

  async getBroadcasts(limit: number = 50, offset: number = 0): Promise<{ broadcasts: BroadcastMessage[], total: number }> {
    const [broadcasts, total] = await this.broadcastRepo.findAndCount({
      relations: ['admin'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { broadcasts, total };
  }

  async getBroadcastById(id: string): Promise<BroadcastMessage> {
    const broadcast = await this.broadcastRepo.findOne({
      where: { id },
      relations: ['admin'],
    });
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    return broadcast;
  }

  /** Cron job to process scheduled broadcasts every minute */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledBroadcasts() {
    this.logger.debug('Checking for scheduled broadcasts...');
    const pendingBroadcasts = await this.broadcastRepo.find({
      where: {
        status: BroadcastStatus.PENDING,
        scheduledAt: LessThanOrEqual(new Date()),
      },
    });

    for (const broadcast of pendingBroadcasts) {
      this.logger.log(`Processing scheduled broadcast ${broadcast.id}`);
      await this.processBroadcast(broadcast.id);
    }
  }

  /** Process and send the broadcast based on target and channels */
  async processBroadcast(broadcastId: string): Promise<BroadcastMessage> {
    const broadcast = await this.broadcastRepo.findOne({ where: { id: broadcastId } });
    if (!broadcast) throw new NotFoundException('Broadcast not found');

    if (broadcast.status !== BroadcastStatus.PENDING) {
      return broadcast; // Already processed
    }

    try {
      // 1. Determine target users
      let targetUsers: User[] = [];

      switch (broadcast.broadcastType) {
        case 'all':
          targetUsers = await this.usersRepo.find({ where: { isActive: true }, select: ['id'] });
          break;
        case 'role':
          if (broadcast.targetRole) {
            targetUsers = await this.usersRepo.find({ where: { role: broadcast.targetRole as UserRole, isActive: true }, select: ['id'] });
          }
          break;
        case 'district':
          if (broadcast.targetDistrict) {
            targetUsers = await this.usersRepo.find({ where: { district: broadcast.targetDistrict, isActive: true }, select: ['id'] });
          }
          break;
        case 'facility':
          if (broadcast.targetFacilityId) {
            targetUsers = await this.usersRepo.find({ where: { facility: broadcast.targetFacilityId, isActive: true }, select: ['id'] });
          }
          break;
        case 'users':
          if (broadcast.targetUserIds && broadcast.targetUserIds.length > 0) {
            const users = await this.usersRepo.findByIds(broadcast.targetUserIds);
            targetUsers = users.filter(u => u.isActive);
          }
          break;
      }

      const userIds = targetUsers.map(u => u.id);
      broadcast.recipientCount = userIds.length;

      if (userIds.length > 0) {
        // 2. Deliver via chosen channels
        const channels = broadcast.deliveryChannels || ['in-app'];

        // IN-APP
        if (channels.includes('in-app') || channels.includes('IN_APP')) {
          await this.broadcast(userIds, broadcast.title, broadcast.body, broadcast.type);
          broadcast.deliveredCount += userIds.length;
        }

        // PUSH NOTIFICATIONS
        if (channels.includes('push') || channels.includes('PUSH')) {
          await this.pushNotificationsService.sendToUsers(userIds, broadcast.title, broadcast.body, {
            type: broadcast.type,
            broadcastId: broadcast.id,
          });
        }

        // SMS / EMAIL (Hooks for optional features)
        if (channels.includes('sms') || channels.includes('SMS')) {
          this.logger.log(`SMS dispatch not fully implemented. Would send SMS to ${userIds.length} users.`);
          // Implement Twilio / Africa's Talking here
        }

        if (channels.includes('email') || channels.includes('EMAIL')) {
          this.logger.log(`Email dispatch not fully implemented. Would send Email to ${userIds.length} users.`);
        }
      }

      broadcast.status = BroadcastStatus.SENT;
      broadcast.sentAt = new Date();
      return await this.broadcastRepo.save(broadcast);

    } catch (error) {
      this.logger.error(`Failed to process broadcast ${broadcastId}:`, error);
      broadcast.status = BroadcastStatus.FAILED;
      return await this.broadcastRepo.save(broadcast);
    }
  }

  /** Backwards compatibility for old methods to use the new process (optional) */
  async broadcastToAll(title: string, body: string, type: NotificationType = NotificationType.INFO, adminId: string) {
    const broadcast = await this.createBroadcast({ title, body, type, broadcastType: 'all', deliveryChannels: ['in-app'] }, adminId);
    return { success: true, recipientCount: broadcast.recipientCount };
  }

  async broadcastToRole(role: UserRole, title: string, body: string, type: NotificationType = NotificationType.INFO, adminId: string) {
    const broadcast = await this.createBroadcast({ title, body, type, broadcastType: 'role', targetRole: role, deliveryChannels: ['in-app'] }, adminId);
    return { success: true, recipientCount: broadcast.recipientCount };
  }

  async broadcastToDistrict(district: string, title: string, body: string, type: NotificationType = NotificationType.INFO, adminId: string) {
    const broadcast = await this.createBroadcast({ title, body, type, broadcastType: 'district', targetDistrict: district, deliveryChannels: ['in-app'] }, adminId);
    return { success: true, recipientCount: broadcast.recipientCount };
  }

  async broadcastToUsers(userIds: string[], title: string, body: string, type: NotificationType = NotificationType.INFO, adminId: string) {
    const broadcast = await this.createBroadcast({ title, body, type, broadcastType: 'users', targetUserIds: userIds, deliveryChannels: ['in-app'] }, adminId);
    return { success: true, recipientCount: broadcast.recipientCount };
  }

  async getBroadcastHistory(limit: number = 50, offset: number = 0) {
    return this.getBroadcasts(limit, offset);
  }
}
