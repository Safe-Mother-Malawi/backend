import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(PrenatalPatient)
    private readonly prenatalRepo: Repository<PrenatalPatient>,
    @InjectRepository(NeonatalPatient)
    private readonly neonatalRepo: Repository<NeonatalPatient>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Run every day at 8:00 AM ──────────────────────────────────────────────

  @Cron('0 8 * * *', { name: 'appointment-reminders', timeZone: 'Africa/Blantyre' })
  async sendAppointmentReminders(): Promise<void> {
    this.logger.log('Running appointment reminder job...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find all appointments scheduled for tomorrow
    const appointments = await this.appointmentRepo.find({
      where: { date: tomorrowStr },
    });

    this.logger.log(`Found ${appointments.length} appointments for tomorrow (${tomorrowStr})`);

    for (const appt of appointments) {
      const userId = await this._resolvePatientUserId(appt);
      if (!userId) continue;

      const time = appt.time ? ` at ${appt.time}` : '';
      const location = appt.location ? ` at ${appt.location}` : '';

      await this.notificationsService.broadcast(
        [userId],
        '📅 ANC Visit Tomorrow',
        `Your ANC appointment "${appt.title}"${time}${location} is scheduled for tomorrow. Please remember to attend.`,
        NotificationType.APPOINTMENT,
      );

      this.logger.log(`Sent tomorrow reminder to user ${userId} for appointment ${appt.id}`);
    }
  }

  // ── Run every day at 9:00 AM ──────────────────────────────────────────────

  @Cron('0 9 * * *', { name: 'iron-tablet-reminders', timeZone: 'Africa/Blantyre' })
  async sendIronTabletReminders(): Promise<void> {
    this.logger.log('Running iron tablet reminder job...');

    // Find all prenatal patients with linked user accounts
    const prenatalPatients = await this.prenatalRepo.find();

    const userIds: string[] = [];
    for (const p of prenatalPatients) {
      if (p.userId) userIds.push(p.userId);
    }

    if (userIds.length === 0) return;

    // Broadcast daily iron tablet reminder to all active prenatal patients
    await this.notificationsService.broadcast(
      userIds,
      '💊 Daily Reminder',
      'Please take your iron tablets and folic acid today. Consistent daily intake is important for your baby\'s development and your health.',
      NotificationType.INFO,
    );

    this.logger.log(`Sent iron tablet reminder to ${userIds.length} prenatal patients`);
  }

  // ── Run every Monday at 8:30 AM — weekly ANC schedule reminder ───────────

  @Cron('30 8 * * 1', { name: 'weekly-anc-reminder', timeZone: 'Africa/Blantyre' })
  async sendWeeklyAncReminder(): Promise<void> {
    this.logger.log('Running weekly ANC reminder job...');

    const prenatalPatients = await this.prenatalRepo.find();
    const userIds = prenatalPatients.filter(p => p.userId).map(p => p.userId!);
    if (userIds.length === 0) return;

    await this.notificationsService.broadcast(
      userIds,
      '🏥 Weekly Health Check',
      'Remember to attend all your scheduled ANC visits. Regular check-ups help keep you and your baby safe. Check your appointments for this week.',
      NotificationType.INFO,
    );

    this.logger.log(`Sent weekly ANC reminder to ${userIds.length} patients`);
  }

  // ── Manual trigger — send reminder for a specific appointment ────────────

  async sendManualReminder(appointmentId: string): Promise<void> {
    const appt = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appt) return;

    const userId = await this._resolvePatientUserId(appt);
    if (!userId) return;

    const time = appt.time ? ` at ${appt.time}` : '';
    const location = appt.location ? ` at ${appt.location}` : '';

    await this.notificationsService.broadcast(
      [userId],
      '📅 Appointment Reminder',
      `Reminder: "${appt.title}"${time}${location} on ${appt.date}. Please don't miss your appointment.`,
      NotificationType.APPOINTMENT,
    );
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private async _resolvePatientUserId(appt: Appointment): Promise<string | null> {
    if (appt.prenatalPatientId) {
      const p = await this.prenatalRepo.findOne({ where: { id: appt.prenatalPatientId } });
      return p?.userId ?? null;
    }
    if (appt.neonatalPatientId) {
      const p = await this.neonatalRepo.findOne({ where: { id: appt.neonatalPatientId } });
      return p?.userId ?? null;
    }
    return null;
  }
}
