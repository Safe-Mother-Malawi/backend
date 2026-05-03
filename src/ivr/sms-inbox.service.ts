/**
 * SMS Inbox Service
 *
 * Fetches inbound SMS messages from Africa's Talking using the
 * fetch messages API, then processes each message:
 *
 *   - Stores raw message in the DB (sms_inbox table)
 *   - Parses keyword commands patients send via SMS
 *   - Routes to the appropriate handler (risk check, appointment, tips, etc.)
 *   - Sends an SMS reply back to the patient
 *
 * Polling is triggered:
 *   1. On a schedule (every 2 minutes via NestJS cron — optional)
 *   2. Via the inbound SMS webhook POST /api/v1/ivr/sms/incoming
 *      (AT can push inbound messages to a callback URL — preferred over polling)
 *
 * AT Fetch Messages API:
 *   GET https://api.africastalking.com/version1/messaging
 *   Headers: apiKey, Accept: application/json
 *   Query:   username, lastReceivedId (0 = fetch all new)
 *
 * Ref: https://developers.africastalking.com/docs/sms/fetch_messages
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SmsInboxMessage, SmsProcessingStatus } from './entities/sms-inbox.entity';
import { AtSmsMessage, AtFetchMessagesResponse } from './dto/sms-message.dto';
import { IvrService } from './ivr.service';
import { PatientsService } from '../patients/patients.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';

// ── SMS keyword commands ──────────────────────────────────────────────────────
// Patients can text these keywords to the SafeMother number (+265885910300)

const KEYWORDS: Record<string, string> = {
  HELP:        'help',
  STATUS:      'status',
  APPOINTMENT: 'appointment',
  APPT:        'appointment',
  TIPS:        'tips',
  EMERGENCY:   'emergency',
  STOP:        'stop',
  START:       'start',
};

@Injectable()
export class SmsInboxService {
  private readonly logger = new Logger(SmsInboxService.name);

  constructor(
    @InjectRepository(SmsInboxMessage)
    private readonly repo: Repository<SmsInboxMessage>,
    private readonly config: ConfigService,
    private readonly ivrService: IvrService,
    private readonly patientsService: PatientsService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  // ── Fetch from AT API ─────────────────────────────────────────────────────

  /**
   * Poll Africa's Talking for new inbound SMS messages.
   * Uses lastReceivedId to only fetch messages we haven't seen yet.
   *
   * AT API:
   *   GET https://api.africastalking.com/version1/messaging
   *   ?username=<username>&lastReceivedId=<id>
   *   Headers: apiKey, Accept: application/json
   */
  async fetchAndProcess(): Promise<{ fetched: number; processed: number }> {
    const apiKey   = this.config.get<string>('AT_API_KEY', '');
    const username = this.config.get<string>('AT_USERNAME', '');

    if (!apiKey || apiKey === 'your_at_api_key_here') {
      this.logger.warn('AT_API_KEY not configured — skipping SMS fetch');
      return { fetched: 0, processed: 0 };
    }

    // Get the last processed message ID from DB
    const lastMsg = await this.repo.findOne({
      where: {},
      order: { atMessageId: 'DESC' },
    });
    const lastReceivedId = lastMsg?.atMessageId ?? 0;

    const url = new URL(
      username === 'sandbox'
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging',
    );
    url.searchParams.set('username', username);
    url.searchParams.set('lastReceivedId', String(lastReceivedId));

    this.logger.log(`Fetching AT SMS inbox — lastReceivedId=${lastReceivedId}`);

    let messages: AtSmsMessage[] = [];
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          apiKey,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`AT fetch messages failed [${response.status}]: ${text}`);
        return { fetched: 0, processed: 0 };
      }

      const data = await response.json() as AtFetchMessagesResponse;
      messages = data?.SMSMessageData?.Messages ?? [];
    } catch (err: unknown) {
      this.logger.error('AT fetch messages network error', err instanceof Error ? err.message : String(err));
      return { fetched: 0, processed: 0 };
    }

    this.logger.log(`Fetched ${messages.length} new SMS message(s) from AT`);

    let processed = 0;
    for (const msg of messages) {
      try {
        await this.processInboundMessage(msg);
        processed++;
      } catch (err: unknown) {
        this.logger.error(`Failed to process SMS id=${msg.id}`, err instanceof Error ? err.message : String(err));
      }
    }

    return { fetched: messages.length, processed };
  }

  // ── Inbound webhook (AT pushes to us) ────────────────────────────────────

  /**
   * Handle an inbound SMS pushed by AT to POST /api/v1/ivr/sms/incoming.
   * AT sends: from, to, text, date, id, linkId
   * This is the preferred method over polling.
   */
  async handleInboundWebhook(payload: {
    from:    string;
    to:      string;
    text:    string;
    date:    string;
    id:      string;
    linkId?: string;
  }): Promise<void> {
    const msg: AtSmsMessage = {
      id:     parseInt(payload.id, 10) || 0,
      text:   payload.text,
      to:     payload.to,
      from:   payload.from,
      date:   payload.date,
      linkId: payload.linkId,
    };
    await this.processInboundMessage(msg);
  }

  // ── Core message processor ────────────────────────────────────────────────

  private async processInboundMessage(msg: AtSmsMessage): Promise<void> {
    const phone = this.normalisePhone(msg.from);

    // Deduplicate — skip if already processed
    const existing = await this.repo.findOne({ where: { atMessageId: msg.id } });
    if (existing) {
      this.logger.debug(`SMS id=${msg.id} already processed — skipping`);
      return;
    }

    // Persist raw message
    const record = this.repo.create({
      atMessageId:  msg.id,
      from:         phone,
      to:           msg.to,
      text:         msg.text,
      receivedAt:   new Date(msg.date),
      status:       SmsProcessingStatus.RECEIVED,
    });
    const saved = await this.repo.save(record);

    this.logger.log(`Inbound SMS from ${phone}: "${msg.text}"`);

    // Parse keyword and route
    const keyword = this.extractKeyword(msg.text);
    let reply: string;

    try {
      reply = await this.routeKeyword(phone, keyword, msg.text);
      await this.repo.update(saved.id, {
        keyword,
        status: SmsProcessingStatus.PROCESSED,
        reply,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await this.repo.update(saved.id, {
        status: SmsProcessingStatus.FAILED,
        errorMessage: errMsg,
      });
      reply = 'Sorry, we could not process your message. Please try again or call 116.';
    }

    // Send reply SMS
    // Note: SMS functionality removed (Africa's Talking removed from project)
    // if (reply) {
    //   this.ivrService.sendSms(phone, reply).catch((err: unknown) =>
    //     this.logger.error(`Failed to send SMS reply to ${phone}`, err instanceof Error ? err.message : String(err)),
    //   );
    // }

    // Create in-app notification if patient has an account
    await this.notifyPatientInApp(phone, msg.text, reply);
  }

  // ── Keyword router ────────────────────────────────────────────────────────

  private async routeKeyword(phone: string, keyword: string, rawText: string): Promise<string> {
    switch (keyword) {
      case 'help':
        return (
          'SafeMother Malawi SMS commands:\n' +
          'APPOINTMENT - next appointment\n' +
          'TIPS - health tips\n' +
          'STATUS - your health status\n' +
          'EMERGENCY - emergency contacts\n' +
          'STOP - unsubscribe\n' +
          'Or dial *860# for full IVR menu.'
        );

      case 'appointment': {
        const prenatal = await this.patientsService.findPrenatalByPhone(phone);
        const neonatal = await this.patientsService.findNeonatalByMotherPhone(phone);
        const pid = prenatal?.id ?? neonatal?.id;
        if (!pid) {
          return 'No patient record found for your number. Please register at your health centre.';
        }
        const appts = prenatal
          ? await this.patientsService['prenatalRepo']?.manager.query(
              `SELECT date, time FROM appointments WHERE "prenatalPatientId" = $1 AND date >= CURRENT_DATE ORDER BY date ASC LIMIT 1`,
              [pid],
            )
          : await this.patientsService['neonatalRepo']?.manager.query(
              `SELECT date, time FROM appointments WHERE "neonatalPatientId" = $1 AND date >= CURRENT_DATE ORDER BY date ASC LIMIT 1`,
              [pid],
            );
        if (appts?.length > 0) {
          const a = appts[0];
          return `Your next appointment: ${a.date}${a.time ? ' at ' + a.time : ''}. Bring your health card.`;
        }
        return 'No upcoming appointments found. Contact your health centre to book one.';
      }

      case 'tips': {
        const isNeo = !!(await this.patientsService.findNeonatalByMotherPhone(phone));
        return isNeo
          ? 'Baby tips: Breastfeed exclusively 6 months. Keep baby warm. Attend all PNC visits. Watch for danger signs: difficulty breathing, not feeding, high fever.'
          : 'Pregnancy tips: Attend all ANC visits. Eat balanced meals. Take iron & folic acid daily. Rest adequately. Visit health centre if unwell.';
      }

      case 'status': {
        const prenatal = await this.patientsService.findPrenatalByPhone(phone);
        if (prenatal) {
          return `Hello ${prenatal.fullName}. You are registered as a prenatal patient at ${prenatal.facilityName ?? 'your health centre'}. Dial *860# to check your health symptoms.`;
        }
        const neonatal = await this.patientsService.findNeonatalByMotherPhone(phone);
        if (neonatal) {
          return `Hello ${neonatal.motherName}. You are registered as a neonatal patient at ${neonatal.facilityName ?? 'your health centre'}. Dial *860# to check your baby's health.`;
        }
        return 'No record found for your number. Please register at your health centre or dial *860#.';
      }

      case 'emergency':
        return 'Emergency contacts:\nAmbulance: 998\nSafeMother Hotline: 116\nIVR: +265885910300\nDial *860# for health check.';

      case 'stop':
        return 'You have been unsubscribed from SafeMother SMS alerts. Text START to re-subscribe.';

      case 'start':
        return 'Welcome back to SafeMother Malawi. You will now receive health alerts. Text HELP for commands or dial *860#.';

      default:
        // Unknown keyword — send help
        return (
          'SafeMother Malawi: Unknown command.\n' +
          'Text HELP for available commands or dial *860# for the full health menu.'
        );
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private extractKeyword(text: string): string {
    const first = text.trim().split(/\s+/)[0].toUpperCase();
    return KEYWORDS[first] ?? 'unknown';
  }

  private normalisePhone(phone: string): string {
    let p = phone.replace(/\s/g, '');
    if (p.startsWith('0'))                               p = '+265' + p.slice(1);
    else if (/^\d{9}$/.test(p))                         p = '+265' + p;
    else if (p.startsWith('265') && !p.startsWith('+')) p = '+' + p;
    return p;
  }

  private async notifyPatientInApp(phone: string, inboundText: string, reply: string): Promise<void> {
    try {
      const user = await this.usersService.findByEmailOrPhone(phone);
      if (!user) return;
      await this.notificationsService.create({
        userId: user.id,
        title:  'SMS Received',
        body:   `Your message "${inboundText.substring(0, 60)}" was processed. Reply: ${reply.substring(0, 100)}`,
        type:   NotificationType.INFO,
      });
    } catch (_) { /* non-critical */ }
  }

  // ── Read operations ───────────────────────────────────────────────────────

  async findAll(filters?: {
    from?: string;
    status?: SmsProcessingStatus;
    limit?: number;
  }): Promise<SmsInboxMessage[]> {
    const qb = this.repo.createQueryBuilder('sms')
      .orderBy('sms.receivedAt', 'DESC')
      .take(filters?.limit ?? 100);

    if (filters?.from)   qb.andWhere('sms.from = :from', { from: filters.from });
    if (filters?.status) qb.andWhere('sms.status = :status', { status: filters.status });

    return qb.getMany();
  }

  async getStats(): Promise<{
    total: number;
    processed: number;
    failed: number;
    byKeyword: { keyword: string; count: number }[];
  }> {
    const [total, processed, failed] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: SmsProcessingStatus.PROCESSED } }),
      this.repo.count({ where: { status: SmsProcessingStatus.FAILED } }),
    ]);

    const byKeyword = await this.repo
      .createQueryBuilder('sms')
      .select('sms.keyword', 'keyword')
      .addSelect('COUNT(*)', 'count')
      .where('sms.keyword IS NOT NULL')
      .groupBy('sms.keyword')
      .orderBy('count', 'DESC')
      .getRawMany<{ keyword: string; count: string }>();

    return {
      total,
      processed,
      failed,
      byKeyword: byKeyword.map((r) => ({ keyword: r.keyword, count: parseInt(r.count, 10) })),
    };
  }
}
