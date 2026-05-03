import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertSeverity } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';
import { IvrService } from '../ivr/ivr.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly repo: Repository<Alert>,
    private readonly activityLog: ActivityLogService,
    private readonly ivrService: IvrService,
  ) {}

  async create(dto: CreateAlertDto, clinician: User): Promise<Alert> {
    const alert = this.repo.create({
      ...dto,
      clinicianId: clinician.id,
      // Inherit the creating clinician's location if not explicitly set
      district:    dto.district    ?? clinician.district    ?? null,
      facilityName: dto.facilityName ?? clinician.facilityName ?? null,
    });
    const saved = await this.repo.save(alert);
    await this.activityLog.log({
      action: ActivityAction.ALERT_CREATED,
      actorId: clinician.id,
      description: `Alert created for ${dto.patientName}: ${dto.reason}`,
      resourceType: 'alert',
      resourceId: saved.id,
      meta: { severity: dto.severity },
    });
    return saved;
  }

  /**
   * Internal — called automatically when a high/moderate risk assessment is submitted.
   * Stores the patient's district + healthCentre so the alert is routed only to
   * clinicians at that facility.
   */
  async createFromRisk(data: {
    patientName: string;
    patientStatus: string;
    contact: string;
    reason: string;
    symptoms: string[];
    severity: AlertSeverity;
    patientId: string | null;
    clinicianId: string | null;
    district?: string | null;
    facilityName?: string | null;
  }): Promise<Alert> {
    const alert = this.repo.create({
      patientName:  data.patientName,
      patientStatus: data.patientStatus,
      contact:      data.contact,
      reason:       data.reason,
      symptoms:     data.symptoms,
      severity:     data.severity,
      patientId:    data.patientId,
      clinicianId:  data.clinicianId,
      district:     data.district    ?? null,
      facilityName: data.facilityName ?? null,
    });
    const saved = await this.repo.save(alert);

    await this.activityLog.log({
      action: ActivityAction.ALERT_CREATED,
      description: `Auto-alert: ${data.severity} for ${data.patientName}`,
      resourceType: 'alert',
      resourceId: saved.id,
      meta: { severity: data.severity, auto: true, district: data.district, facilityName: data.facilityName },
    });

    // For critical or high alerts, reach the patient via SMS and outbound call
    if (
      data.contact &&
      (data.severity === AlertSeverity.CRITICAL || data.severity === AlertSeverity.HIGH)
    ) {
      const smsMessage =
        data.severity === AlertSeverity.CRITICAL
          ? `URGENT - Safe Mother Malawi: ${data.reason}. Please go to the nearest hospital immediately or call 998.`
          : `Safe Mother Malawi Alert: ${data.reason}. Please visit your health centre today.`;

      // SMS and outbound call functionality removed (Africa's Talking removed from project)
      // this.ivrService.sendSms(data.contact, smsMessage).catch((err: unknown) =>
      //   this.logger.error(`IVR SMS failed for alert ${saved.id}`, err instanceof Error ? err.message : String(err)),
      // );
      //
      // if (data.severity === AlertSeverity.CRITICAL) {
      //   this.ivrService.makeOutboundCall({ to: data.contact }).catch((err: unknown) =>
      //     this.logger.error(`IVR outbound call failed for alert ${saved.id}`, err instanceof Error ? err.message : String(err)),
      //   );
      // }
    }

    return saved;
  }

  /**
   * Returns alerts visible to the requesting user:
   * - ADMIN / DHO: all alerts (DHO scoped to their district)
   * - CLINICIAN: only alerts matching their district AND health facility
   */
  async findAll(user: User): Promise<Alert[]> {
    return this._buildQuery(user, false);
  }

  async findActive(user: User): Promise<Alert[]> {
    return this._buildQuery(user, true);
  }

  private async _buildQuery(user: User, activeOnly: boolean): Promise<Alert[]> {
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.clinician', 'clinician')
      .orderBy('a.createdAt', 'DESC');

    if (activeOnly) qb.andWhere('a.attended = false');

    if (user.role === UserRole.CLINICIAN) {
      if (user.district && user.facilityName) {
        // Match: same district+facility, OR district-only match, OR unrouted, OR own alerts
        qb.andWhere(
          `(
            (LOWER(a.district) = LOWER(:district) AND LOWER(a.facilityName) = LOWER(:hc))
            OR (LOWER(a.district) = LOWER(:district) AND a.facilityName IS NULL)
            OR (a.district IS NULL AND a.facilityName IS NULL)
            OR (a.clinicianId = :cid)
          )`,
          { district: user.district, hc: user.facilityName, cid: user.id },
        );
      } else if (user.district) {
        qb.andWhere(
          `(LOWER(a.district) = LOWER(:district) OR a.district IS NULL OR a.clinicianId = :cid)`,
          { district: user.district, cid: user.id },
        );
      } else {
        // No location on clinician — show all unrouted + their own
        qb.andWhere(
          `(a.district IS NULL OR a.clinicianId = :cid)`,
          { cid: user.id },
        );
      }
    } else if (user.role === UserRole.DHO) {
      if (user.district) {
        qb.andWhere(
          `(LOWER(a.district) = LOWER(:district) OR a.district IS NULL)`,
          { district: user.district },
        );
      }
    }
    // ADMIN sees everything

    return qb.getMany();
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.repo.findOne({ where: { id }, relations: ['clinician'] });
    if (!alert) throw new NotFoundException('Alert not found.');
    return alert;
  }

  async markAttended(id: string, actorId?: string): Promise<Alert> {
    await this.repo.update(id, { attended: true });
    const updated = await this.findOne(id);
    await this.activityLog.log({
      action: ActivityAction.ALERT_ATTENDED,
      actorId,
      description: `Alert for ${updated.patientName} marked as attended`,
      resourceType: 'alert',
      resourceId: id,
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    const alert = await this.findOne(id);
    await this.repo.remove(alert);
  }
}
