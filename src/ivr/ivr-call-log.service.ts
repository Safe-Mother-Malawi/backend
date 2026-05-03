import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  IvrCallLog,
  IvrCallStatus,
  IvrCallOutcome,
  IvrMenuAction,
  IvrInteraction,
} from './entities/ivr-call-log.entity';

export interface LogEntry extends Omit<IvrInteraction, 'timestamp'> {
  sessionId: string;
  callerPhone: string;
  patientId?: string | null;
  patientName?: string | null;
  patientType?: 'prenatal' | 'neonatal' | null;
  district?: string | null;
  healthCentre?: string | null;
  outcome?: IvrCallOutcome;
}

export interface IvrAnalyticsSummary {
  period: { from: Date; to: Date };
  totalCalls: number;
  completedCalls: number;
  abandonedCalls: number;
  completionRate: number;
  riskAssessmentsCompleted: number;
  appointmentChecks: number;
  emergencyAccesses: number;
  prenatalCalls: number;
  neonatalCalls: number;
  avgDurationSeconds: number | null;
  riskLevelBreakdown: { level: string; count: number }[];
  districtBreakdown:  { district: string; count: number }[];
  dailyVolume:        { date: string; count: number }[];
}

@Injectable()
export class IvrCallLogService {
  private readonly logger = new Logger(IvrCallLogService.name);

  constructor(
    @InjectRepository(IvrCallLog)
    private readonly repo: Repository<IvrCallLog>,
  ) {}

  // ── Primary write method ──────────────────────────────────────────────────

  /**
   * Unified log method called from IvrService on every interaction.
   * - CALL_START  → creates a new call log row
   * - CALL_END    → marks the call completed/abandoned
   * - Everything else → appends an interaction to the existing row
   */
  log(entry: LogEntry): void {
    // Fire-and-forget — never block the IVR response
    this._persist(entry).catch((err: unknown) =>
      this.logger.error(
        `Failed to persist IVR log entry [${entry.action}] for ${entry.callerPhone}`,
        err instanceof Error ? err.message : String(err),
      ),
    );
  }

  private async _persist(entry: LogEntry): Promise<void> {
    if (entry.action === IvrMenuAction.CALL_START) {
      await this.repo.save(
        this.repo.create({
          sessionId:    entry.sessionId,
          callerPhone:  entry.callerPhone,
          patientId:    entry.patientId    ?? null,
          patientName:  entry.patientName  ?? null,
          patientType:  entry.patientType  ?? null,
          district:     entry.district     ?? null,
          healthCentre: entry.healthCentre ?? null,
          status:       IvrCallStatus.IN_PROGRESS,
          interactions: [],
        }),
      );
      return;
    }

    if (entry.action === IvrMenuAction.CALL_END) {
      const log = await this.repo.findOne({ where: { sessionId: entry.sessionId } });
      if (!log) return;

      const outcome = entry.outcome ?? this.deriveOutcome(log);
      await this.repo.update({ sessionId: entry.sessionId }, {
        status:  IvrCallStatus.COMPLETED,
        outcome,
        endedAt: new Date(),
      });
      return;
    }

    // All other actions — append interaction to existing row
    const log = await this.repo.findOne({ where: { sessionId: entry.sessionId } });
    if (!log) return;

    const interaction: IvrInteraction = {
      timestamp:    new Date().toISOString(),
      action:       entry.action,
      menuKey:      entry.menuKey,
      questionText: entry.questionText,
      digitPressed: entry.digitPressed,
      answerLabel:  entry.answerLabel,
      answerScore:  entry.answerScore,
      riskScore:    entry.riskScore,
      riskCategory: entry.riskCategory,
      carePathway:  entry.carePathway,
      isTimeout:    entry.isTimeout,
    };

    // Strip undefined keys to keep JSONB clean
    (Object.keys(interaction) as (keyof IvrInteraction)[]).forEach((k) => {
      if ((interaction as unknown as Record<string, unknown>)[k] === undefined) {
        delete (interaction as unknown as Record<string, unknown>)[k];
      }
    });

    log.interactions = [...log.interactions, interaction];

    // If this is a risk result, also update the top-level columns for easy querying
    if (entry.action === IvrMenuAction.RISK_RESULT && entry.riskScore !== undefined) {
      log.riskScore    = entry.riskScore ?? null;
      log.riskLevel    = entry.riskCategory ?? null;
      log.carePathway  = entry.carePathway  ?? null;
      log.outcome      = IvrCallOutcome.RISK_COMPLETED;
    }

    // Update patient info if it was resolved during this interaction
    if (entry.patientId && !log.patientId) {
      log.patientId   = entry.patientId;
      log.patientName = entry.patientName ?? null;
      log.patientType = entry.patientType ?? null;
    }

    // Update district/facility if provided
    if (entry.district && !log.district) {
      log.district = entry.district;
    }
    if (entry.healthCentre && !log.healthCentre) {
      log.healthCentre = entry.healthCentre;
    }

    await this.repo.save(log);
  }

  // ── Read / Analytics ──────────────────────────────────────────────────────

  async findAll(filters?: {
    from?: Date;
    to?: Date;
    patientType?: 'prenatal' | 'neonatal';
    status?: IvrCallStatus;
    outcome?: IvrCallOutcome;
    district?: string;
  }): Promise<IvrCallLog[]> {
    const qb = this.repo.createQueryBuilder('log')
      .orderBy('log.startedAt', 'DESC');

    if (filters?.from && filters?.to) {
      qb.andWhere('log.startedAt BETWEEN :from AND :to', { from: filters.from, to: filters.to });
    } else if (filters?.from) {
      qb.andWhere('log.startedAt >= :from', { from: filters.from });
    }
    if (filters?.patientType) qb.andWhere('log.patientType = :pt', { pt: filters.patientType });
    if (filters?.status)      qb.andWhere('log.status = :status', { status: filters.status });
    if (filters?.outcome)     qb.andWhere('log.outcome = :outcome', { outcome: filters.outcome });
    if (filters?.district)    qb.andWhere('LOWER(log.district) = LOWER(:district)', { district: filters.district });

    return qb.getMany();
  }

  async findOne(id: string): Promise<IvrCallLog | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByPatient(patientId: string): Promise<IvrCallLog[]> {
    return this.repo.find({ where: { patientId }, order: { startedAt: 'DESC' } });
  }

  async getSummary(from: Date, to: Date): Promise<IvrAnalyticsSummary> {
    const [
      totalCalls, completedCalls, abandonedCalls,
      riskAssessments, appointmentChecks, emergencyAccesses,
      prenatalCalls, neonatalCalls,
    ] = await Promise.all([
      this.repo.count({ where: { startedAt: Between(from, to) } }),
      this.repo.count({ where: { startedAt: Between(from, to), status: IvrCallStatus.COMPLETED } }),
      this.repo.count({ where: { startedAt: Between(from, to), status: IvrCallStatus.ABANDONED } }),
      this.repo.count({ where: { startedAt: Between(from, to), outcome: IvrCallOutcome.RISK_COMPLETED } }),
      this.repo.count({ where: { startedAt: Between(from, to), outcome: IvrCallOutcome.APPOINTMENT } }),
      this.repo.count({ where: { startedAt: Between(from, to), outcome: IvrCallOutcome.EMERGENCY } }),
      this.repo.count({ where: { startedAt: Between(from, to), patientType: 'prenatal' } }),
      this.repo.count({ where: { startedAt: Between(from, to), patientType: 'neonatal' } }),
    ]);

    const riskBreakdown = await this.repo
      .createQueryBuilder('log')
      .select('log.riskLevel', 'riskLevel')
      .addSelect('COUNT(*)', 'count')
      .where('log.startedAt BETWEEN :from AND :to', { from, to })
      .andWhere('log.riskLevel IS NOT NULL')
      .groupBy('log.riskLevel')
      .getRawMany<{ riskLevel: string; count: string }>();

    const durationResult = await this.repo
      .createQueryBuilder('log')
      .select('AVG(log.durationSeconds)', 'avg')
      .where('log.startedAt BETWEEN :from AND :to', { from, to })
      .andWhere('log.durationSeconds IS NOT NULL')
      .getRawOne<{ avg: string }>();

    const districtBreakdown = await this.repo
      .createQueryBuilder('log')
      .select('log.district', 'district')
      .addSelect('COUNT(*)', 'count')
      .where('log.startedAt BETWEEN :from AND :to', { from, to })
      .andWhere('log.district IS NOT NULL')
      .groupBy('log.district')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ district: string; count: string }>();

    const dailyVolume = await this.repo
      .createQueryBuilder('log')
      .select("DATE_TRUNC('day', log.startedAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.startedAt BETWEEN :from AND :to', { from, to })
      .groupBy("DATE_TRUNC('day', log.startedAt)")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    return {
      period: { from, to },
      totalCalls,
      completedCalls,
      abandonedCalls,
      completionRate: totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0,
      riskAssessmentsCompleted: riskAssessments,
      appointmentChecks,
      emergencyAccesses,
      prenatalCalls,
      neonatalCalls,
      avgDurationSeconds: durationResult?.avg ? Math.round(parseFloat(durationResult.avg)) : null,
      riskLevelBreakdown: riskBreakdown.map((r) => ({ level: r.riskLevel, count: parseInt(r.count, 10) })),
      districtBreakdown:  districtBreakdown.map((d) => ({ district: d.district, count: parseInt(d.count, 10) })),
      dailyVolume:        dailyVolume.map((d) => ({ date: d.date, count: parseInt(d.count, 10) })),
    };
  }

  private deriveOutcome(log: IvrCallLog): IvrCallOutcome {
    if (log.riskScore !== null) return IvrCallOutcome.RISK_COMPLETED;
    const menus = log.interactions.map((i) => i.menuKey ?? '');
    if (menus.includes('appointment_info')) return IvrCallOutcome.APPOINTMENT;
    if (menus.includes('health_tips'))      return IvrCallOutcome.TIPS;
    if (menus.includes('emergency'))        return IvrCallOutcome.EMERGENCY;
    if (log.interactions.some((i) => i.isTimeout)) return IvrCallOutcome.TIMEOUT;
    return IvrCallOutcome.ABANDONED_EARLY;
  }
}
