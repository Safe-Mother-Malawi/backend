import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notif = this.repo.create(dto);
    return this.repo.save(notif);
  }

  /** Broadcast a notification to multiple users */
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

  /**
   * Notify all users of a given role.
   * - DHO: receives notifications from clinician activities
   * - CLINICIAN: receives notifications from patient (prenatal/neonatal) activities
   * - ADMIN: receives system-level notifications
   */
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

  /** Notify DHOs about a clinician action */
  async notifyDHOs(title: string, body: string, type = NotificationType.INFO): Promise<void> {
    return this.notifyRole(UserRole.DHO, title, body, type);
  }

  /** Notify all clinicians about a patient/user action */
  async notifyClinicians(title: string, body: string, type = NotificationType.INFO): Promise<void> {
    return this.notifyRole(UserRole.CLINICIAN, title, body, type);
  }

  /** Notify all admins about a system event */
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
}
