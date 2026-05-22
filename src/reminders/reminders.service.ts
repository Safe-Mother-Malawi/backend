import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Reminder, ReminderStatus, ReminderType, ReminderFrequency } from './entities/reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { EventsGateway, SocketEvent } from '../events/events.gateway';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Create a new reminder for a user
   */
  async create(userId: string, dto: CreateReminderDto): Promise<Reminder> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const reminder = this.reminderRepo.create({
      userId,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      frequency: dto.frequency,
      scheduledFor: new Date(dto.scheduledFor),
      appointmentId: dto.appointmentId,
      patientId: dto.patientId,
      metadata: dto.metadata,
      status: ReminderStatus.PENDING,
    });

    return this.reminderRepo.save(reminder);
  }

  /**
   * Get all reminders for a user
   */
  async findByUser(userId: string): Promise<Reminder[]> {
    return this.reminderRepo.find({
      where: { userId },
      order: { scheduledFor: 'ASC' },
    });
  }

  /**
   * Get pending reminders for a user
   */
  async findPendingByUser(userId: string): Promise<Reminder[]> {
    return this.reminderRepo.find({
      where: { userId, status: ReminderStatus.PENDING },
      order: { scheduledFor: 'ASC' },
    });
  }

  /**
   * Get a single reminder by ID
   */
  async findById(id: string): Promise<Reminder | null> {
    return this.reminderRepo.findOne({ where: { id } });
  }

  /**
   * Update reminder status
   */
  async updateStatus(id: string, status: ReminderStatus): Promise<Reminder | null> {
    const reminder = await this.reminderRepo.findOne({ where: { id } });
    if (!reminder) return null;

    reminder.status = status;
    if (status === ReminderStatus.SENT) {
      reminder.sentAt = new Date();
    }

    return this.reminderRepo.save(reminder);
  }

  /**
   * Acknowledge a reminder (mark as seen by user)
   */
  async acknowledge(id: string): Promise<Reminder | null> {
    const reminder = await this.reminderRepo.findOne({ where: { id } });
    if (!reminder) return null;

    reminder.acknowledged = true;
    return this.reminderRepo.save(reminder);
  }

  /**
   * Cancel a reminder
   */
  async cancel(id: string): Promise<Reminder | null> {
    const reminder = await this.reminderRepo.findOne({ where: { id } });
    if (!reminder) return null;

    reminder.status = ReminderStatus.CANCELLED;
    return this.reminderRepo.save(reminder);
  }

  /**
   * Delete a reminder
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.reminderRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Reschedule a reminder
   */
  async reschedule(id: string, newScheduledFor: Date): Promise<Reminder | null> {
    const reminder = await this.reminderRepo.findOne({ where: { id } });
    if (!reminder) return null;

    reminder.scheduledFor = newScheduledFor;
    reminder.status = ReminderStatus.PENDING;
    reminder.sentAt = null;

    return this.reminderRepo.save(reminder);
  }

  /**
   * Cron job: Send pending reminders every minute
   * Runs at the top of every minute
   */
  @Cron('0 * * * * *', { name: 'send-pending-reminders', timeZone: 'Africa/Blantyre' })
  async sendPendingReminders(): Promise<void> {
    try {
      const now = new Date();

      // Find all pending reminders scheduled for now or earlier
      const pendingReminders = await this.reminderRepo.find({
        where: {
          status: ReminderStatus.PENDING,
          scheduledFor: LessThanOrEqual(now),
        },
        relations: ['user'],
      });

      this.logger.log(`Found ${pendingReminders.length} reminders to send`);

      for (const reminder of pendingReminders) {
        try {
          await this.sendReminder(reminder);
        } catch (error) {
          this.logger.error(`Failed to send reminder ${reminder.id}:`, error);
          reminder.status = ReminderStatus.FAILED;
          await this.reminderRepo.save(reminder);
        }
      }
    } catch (error) {
      this.logger.error('Error in sendPendingReminders cron job:', error);
    }
  }

  /**
   * Send a single reminder
   */
  private async sendReminder(reminder: Reminder): Promise<void> {
    // Create in-app notification
    await this.notificationsService.create({
      userId: reminder.userId,
      title: reminder.title,
      body: reminder.body,
      type: this.mapReminderTypeToNotificationType(reminder.type),
    });

    // Send push notification
    try {
      await this.pushNotificationsService.sendToUser(
        reminder.userId,
        reminder.title,
        reminder.body,
        {
          reminderId: reminder.id,
          type: reminder.type,
          scheduledFor: reminder.scheduledFor.toISOString(),
        },
      );
    } catch (error) {
      this.logger.warn(`Failed to send push notification for reminder ${reminder.id}:`, error);
    }

    // Update reminder status
    reminder.status = ReminderStatus.SENT;
    reminder.sentAt = new Date();

    // Handle recurring reminders
    if (reminder.frequency !== ReminderFrequency.ONCE) {
      const nextReminderAt = this.calculateNextReminderTime(
        reminder.scheduledFor,
        reminder.frequency,
      );
      reminder.nextReminderAt = nextReminderAt;
      reminder.status = ReminderStatus.PENDING;
      reminder.scheduledFor = nextReminderAt;
    }

    await this.reminderRepo.save(reminder);

    // Emit WebSocket event for real-time notification
    this.eventsGateway.emit(SocketEvent.REMINDER_SENT, {
      userId: reminder.userId,
      reminderId: reminder.id,
      title: reminder.title,
      type: reminder.type,
    });

    this.logger.log(`Reminder ${reminder.id} sent to user ${reminder.userId}`);
  }

  /**
   * Calculate next reminder time based on frequency
   */
  private calculateNextReminderTime(currentTime: Date, frequency: ReminderFrequency): Date {
    const next = new Date(currentTime);

    switch (frequency) {
      case ReminderFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case ReminderFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case ReminderFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case ReminderFrequency.ONCE:
      default:
        return null;
    }

    return next;
  }

  /**
   * Map reminder type to notification type
   */
  private mapReminderTypeToNotificationType(type: ReminderType): NotificationType {
    switch (type) {
      case ReminderType.APPOINTMENT:
      case ReminderType.ANC_VISIT:
      case ReminderType.PRENATAL_CHECKUP:
      case ReminderType.NEONATAL_CHECKUP:
        return NotificationType.APPOINTMENT;
      default:
        return NotificationType.INFO;
    }
  }

  /**
   * Create appointment reminders (called when appointment is created/updated)
   */
  async createAppointmentReminder(
    userId: string,
    appointmentId: string,
    appointmentDate: string,
    appointmentTime: string,
    title: string,
  ): Promise<Reminder> {
    // Schedule reminder for 24 hours before appointment
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime || '09:00'}`);
    const reminderTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);

    return this.create(userId, {
      title: `Reminder: ${title}`,
      body: `Your appointment is scheduled for ${appointmentDate} at ${appointmentTime || 'TBD'}`,
      type: ReminderType.APPOINTMENT,
      frequency: ReminderFrequency.ONCE,
      scheduledFor: reminderTime.toISOString(),
      appointmentId,
      metadata: { appointmentDate, appointmentTime },
    });
  }

  /**
   * Create recurring daily reminders (e.g., iron tablets)
   */
  async createDailyReminder(
    userId: string,
    type: ReminderType,
    title: string,
    body: string,
    startTime: Date,
  ): Promise<Reminder> {
    return this.create(userId, {
      title,
      body,
      type,
      frequency: ReminderFrequency.DAILY,
      scheduledFor: startTime.toISOString(),
      metadata: { autoGenerated: true },
    });
  }

  /**
   * Get reminders for a specific date range
   */
  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Reminder[]> {
    return this.reminderRepo
      .createQueryBuilder('r')
      .where('r.userId = :userId', { userId })
      .andWhere('r.scheduledFor BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('r.scheduledFor', 'ASC')
      .getMany();
  }

  /**
   * Get statistics for reminders
   */
  async getStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    const total = await this.reminderRepo.count({ where: { userId } });
    const pending = await this.reminderRepo.count({ where: { userId, status: ReminderStatus.PENDING } });
    const sent = await this.reminderRepo.count({ where: { userId, status: ReminderStatus.SENT } });
    const failed = await this.reminderRepo.count({ where: { userId, status: ReminderStatus.FAILED } });
    const cancelled = await this.reminderRepo.count({ where: { userId, status: ReminderStatus.CANCELLED } });

    return { total, pending, sent, failed, cancelled };
  }
}
