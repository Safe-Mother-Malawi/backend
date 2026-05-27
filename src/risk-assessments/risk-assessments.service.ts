import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RiskAssessment, RiskLevel, PatientType,
} from './entities/risk-assessment.entity';
import { CreateRiskAssessmentDto } from './dto/create-risk-assessment.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity } from '../alerts/entities/alert.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';
import { UsersService } from '../users/users.service';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';
import { EventsGateway, SocketEvent } from '../events/events.gateway';
import { HealthCheckHistory } from '../health-check-history/entities/health-check-history.entity';

@Injectable()
export class RiskAssessmentsService {
  constructor(
    @InjectRepository(RiskAssessment)
    private readonly repo: Repository<RiskAssessment>,
    @InjectRepository(PrenatalPatient)
    private readonly prenatalRepo: Repository<PrenatalPatient>,
    @InjectRepository(NeonatalPatient)
    private readonly neonatalRepo: Repository<NeonatalPatient>,
    @InjectRepository(HealthCheckHistory)
    private readonly healthCheckHistoryRepo: Repository<HealthCheckHistory>,
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
    private readonly activityLog: ActivityLogService,
    private readonly usersService: UsersService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ── Risk level derivation ─────────────────────────────────────────────────

  /**
   * Prenatal scoring (from DiagnosticScreen):
   *   ≤4  → Low Risk
   *   5–12 → Moderate Risk
   *   13+  → High Risk
   *
   * Neonatal health assessment:
   *   0–5  → Low Risk (Baby Appears Well)
   *   6–14 → Moderate Risk (Monitor Closely)
   *   15+  → Critical (Seek Help Immediately)
   */
  static deriveRiskLevel(score: number, patientType: PatientType): RiskLevel {
    if (patientType === PatientType.NEONATAL) {
      if (score <= 5)  return RiskLevel.LOW;
      if (score <= 14) return RiskLevel.MODERATE;
      return RiskLevel.CRITICAL;
    }
    // Prenatal
    if (score <= 4)  return RiskLevel.LOW;
    if (score <= 12) return RiskLevel.MODERATE;
    if (score <= 20) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateRiskAssessmentDto, submittedBy: User): Promise<RiskAssessment> {
    const riskLevel = RiskAssessmentsService.deriveRiskLevel(dto.score, dto.patientType);

    const record = this.repo.create({
      ...dto,
      riskLevel,
      submittedById: submittedBy.id,
    });
    const saved = await this.repo.save(record);

    // Broadcast real-time update to all connected dashboards
    this.eventsGateway.emit(SocketEvent.ANALYTICS_UPDATED, {
      type: 'risk_assessment',
      riskLevel,
      patientType: dto.patientType,
    });

    // ── Activity log ──────────────────────────────────────────────────────
    await this.activityLog.log({
      action: ActivityAction.RISK_SUBMITTED,
      actorId: submittedBy.id,
      description: `${dto.patientType} risk assessment submitted for ${dto.patientName}: ${riskLevel} (score ${dto.score})`,
      resourceType: 'risk_assessment',
      resourceId: saved.id,
      meta: { riskLevel, score: dto.score, patientType: dto.patientType },
    });

    // ── Auto-alert for moderate/high/critical risk ────────────────────────
    if (riskLevel === RiskLevel.MODERATE || riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
      const severity = riskLevel === RiskLevel.CRITICAL ? AlertSeverity.CRITICAL
          : riskLevel === RiskLevel.HIGH ? AlertSeverity.HIGH
          : AlertSeverity.MEDIUM;

      // Resolve patient location for routing the alert to the right clinicians
      const location = await this._resolvePatientLocation(dto.patientId, dto.patientType, submittedBy);

      // Create a clinician-visible alert routed by district + facility
      await this.alertsService.createFromRisk({
        patientName: dto.patientName,
        patientStatus: dto.patientType === PatientType.PRENATAL ? 'Prenatal' : 'Neonatal',
        contact: dto.patientPhone,
        reason: `${riskLevel} — Score ${dto.score}. ${dto.message}`,
        symptoms: dto.symptoms ?? [],
        severity,
        patientId: dto.patientId,
        clinicianId: submittedBy.role === UserRole.CLINICIAN ? submittedBy.id : null,
        district:    location.district,
        facilityName: location.facilityName,
      });

      await this.activityLog.log({
        action: ActivityAction.RISK_HIGH_FLAGGED,
        actorId: submittedBy.id,
        description: `HIGH RISK flagged for ${dto.patientName} — ${riskLevel}`,
        resourceType: 'risk_assessment',
        resourceId: saved.id,
        meta: { riskLevel, patientPhone: dto.patientPhone },
      });

      // Notify all clinicians about the high-risk case
      await this.notifyAllClinicians(dto.patientName, riskLevel, dto.patientType);

      // Notify DHOs about the high-risk case from a clinician
      if (submittedBy.role === UserRole.CLINICIAN) {
        await this.notificationsService.notifyDHOs(
          `High-Risk Case: ${dto.patientName}`,
          `Clinician ${submittedBy.fullName} flagged a ${dto.patientType} patient as ${riskLevel} (score ${dto.score}).`,
          NotificationType.ALERT,
        );
      }
    }

    // ── Notify the patient themselves ─────────────────────────────────────
    if (submittedBy.role === UserRole.PRENATAL || submittedBy.role === UserRole.NEONATAL) {
      const notifType = riskLevel === RiskLevel.LOW
        ? NotificationType.INFO
        : NotificationType.ALERT;

      await this.notificationsService.create({
        userId: submittedBy.id,
        title: `Health Check Result: ${riskLevel}`,
        body: dto.message,
        type: notifType,
      });
    }

    return saved;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  async findAll(limit: number = 50, offset: number = 0): Promise<RiskAssessment[]> {
    if (limit < 1 || limit > 1000) limit = 50; // Enforce reasonable limits
    if (offset < 0) offset = 0;
    
    return this.repo.find({
      relations: ['submittedBy'],
      order: { submittedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findByPatient(patientId: string): Promise<RiskAssessment[]> {
    const assessments = await this.repo.find({
      where: { patientId },
      relations: ['submittedBy'],
      order: { submittedAt: 'DESC' },
    });

    const patientContext = await this._resolvePatientContext(patientId);
    if (!patientContext?.userId) {
      return assessments;
    }

    const histories = await this.healthCheckHistoryRepo.find({
      where: { userId: patientContext.userId },
      relations: ['submittedBy'],
      order: { createdAt: 'DESC' },
    });

    const mirroredHistoryIds = new Set(
      assessments
        .map((assessment) => assessment.answers?.healthCheckHistoryId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    );

    const historyAssessments = histories
      .filter((history) => !mirroredHistoryIds.has(history.id))
      .map((history) => this._healthHistoryToRiskAssessment(history, patientContext));

    return [...assessments, ...historyAssessments].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }

  async findOne(id: string): Promise<RiskAssessment> {
    const record = await this.repo.findOne({ where: { id }, relations: ['submittedBy'] });
    if (!record) throw new NotFoundException('Risk assessment not found.');
    return record;
  }

  async delete(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async _resolvePatientContext(patientId: string): Promise<{
    id: string;
    userId: string | null;
    patientName: string;
    patientPhone: string;
    patientType: PatientType;
  } | null> {
    const prenatal = await this.prenatalRepo.findOne({ where: { id: patientId } });
    if (prenatal) {
      return {
        id: prenatal.id,
        userId: prenatal.userId,
        patientName: prenatal.fullName,
        patientPhone: prenatal.phone,
        patientType: PatientType.PRENATAL,
      };
    }

    const neonatal = await this.neonatalRepo.findOne({ where: { id: patientId } });
    if (neonatal) {
      return {
        id: neonatal.id,
        userId: neonatal.userId,
        patientName: neonatal.motherName || neonatal.babyName || 'Neonatal Patient',
        patientPhone: neonatal.motherPhone || '',
        patientType: PatientType.NEONATAL,
      };
    }

    return null;
  }

  private _healthHistoryToRiskAssessment(
    history: HealthCheckHistory,
    patient: {
      id: string;
      patientName: string;
      patientPhone: string;
      patientType: PatientType;
    },
  ): RiskAssessment {
    return {
      id: `health-check-${history.id}`,
      patientId: patient.id,
      patientName: patient.patientName,
      patientPhone: patient.patientPhone,
      patientType: patient.patientType,
      riskLevel: history.riskLevel as unknown as RiskLevel,
      score: Math.round(Number(history.score) || 0),
      message: history.message,
      answers: {
        ...(history.answers ?? {}),
        healthCheckHistoryId: history.id,
        maxScore: history.maxScore,
        percentage: history.percentage,
        symptoms: history.symptoms ?? [],
      },
      submittedById: history.submittedById || history.userId,
      submittedBy: history.submittedBy ?? null,
      submittedAt: history.createdAt,
    } as RiskAssessment;
  }

  /**
   * Resolve the district and healthCentre for a patient record.
   * Priority:
   * 1. Patient record (prenatal/neonatal table)
   * 2. Linked mobile user account (users table via userId)
   * 3. Submitting user's own district/facility
   */
  private async _resolvePatientLocation(
    patientId: string,
    patientType: PatientType,
    submittedBy?: User,
  ): Promise<{ district: string | null; facilityName: string | null }> {
    try {
      let district: string | null = null;
      let facilityName: string | null = null;

      if (patientType === PatientType.PRENATAL) {
        const p = await this.prenatalRepo.findOne({ where: { id: patientId } });
        district     = p?.district     ?? null;
        facilityName = p?.facilityName ?? null;

        // Fallback: check linked user account
        if ((!district || !facilityName) && p?.userId) {
          const linkedUser = await this.usersService.findById(p.userId);
          district     = district     ?? linkedUser?.district     ?? null;
          facilityName = facilityName ?? linkedUser?.facilityName ?? null;
        }
      } else {
        const p = await this.neonatalRepo.findOne({ where: { id: patientId } });
        district     = p?.district     ?? null;
        facilityName = p?.facilityName ?? null;

        // Fallback: check linked user account
        if ((!district || !facilityName) && p?.userId) {
          const linkedUser = await this.usersService.findById(p.userId);
          district     = district     ?? linkedUser?.district     ?? null;
          facilityName = facilityName ?? linkedUser?.facilityName ?? null;
        }
      }

      // Final fallback: use the submitting user's location
      if (!district && submittedBy) district = submittedBy.district ?? null;
      if (!facilityName && submittedBy) facilityName = submittedBy.facilityName ?? null;

      return { district, facilityName };
    } catch {
      return {
        district:     submittedBy?.district     ?? null,
        facilityName: submittedBy?.facilityName ?? null,
      };
    }
  }

  private async notifyAllClinicians(
    patientName: string,
    riskLevel: RiskLevel,
    patientType: PatientType,
  ): Promise<void> {
    // Find all clinician user IDs
    const clinicians = await this.usersService.findByRole(UserRole.CLINICIAN);
    const ids = clinicians.map((c) => c.id);
    if (ids.length === 0) return;

    await this.notificationsService.broadcast(
      ids,
      `${riskLevel} — ${patientName}`,
      `A ${patientType} patient has been flagged as ${riskLevel}. Please review immediately.`,
      NotificationType.ALERT,
    );
  }
}
