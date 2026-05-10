import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';
import { RiskAssessment, RiskLevel } from '../risk-assessments/entities/risk-assessment.entity';
import { Alert } from '../alerts/entities/alert.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(PrenatalPatient)
    private readonly prenatalRepo: Repository<PrenatalPatient>,
    @InjectRepository(NeonatalPatient)
    private readonly neonatalRepo: Repository<NeonatalPatient>,
    @InjectRepository(RiskAssessment)
    private readonly riskRepo: Repository<RiskAssessment>,
    @InjectRepository(Alert)
    private readonly alertsRepo: Repository<Alert>,
  ) {}

  async getOverview() {
    const [
      totalClinicians,
      totalPrenatal,
      totalNeonatal,
      highRiskCount,
      activeAlerts,
    ] = await Promise.all([
      this.usersRepo.count({ where: { role: UserRole.CLINICIAN } }),
      this.prenatalRepo.count(),
      this.neonatalRepo.count(),
      this.riskRepo.count({ where: { riskLevel: RiskLevel.HIGH } }),
      this.alertsRepo.count({ where: { attended: false } }),
    ]);

    const criticalCount = await this.riskRepo.count({ where: { riskLevel: RiskLevel.CRITICAL } });

    return {
      totalClinicians,
      totalMothers: totalPrenatal + totalNeonatal,
      totalPrenatal,
      totalNeonatal,
      highRiskCases: highRiskCount + criticalCount,
      activeAlerts,
    };
  }

  async getRegistrationTrends() {
    // Monthly registrations for the last 12 months
    // Use raw SQL with actual DB column names (TypeORM maps createdAt → created_at)
    const prenatalTrends = await this.prenatalRepo.manager.query(`
      SELECT
        TO_CHAR("createdAt", 'Mon') AS month,
        EXTRACT(MONTH FROM "createdAt")::int AS "monthNum",
        COUNT(*)::int AS count
      FROM prenatal_patients
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR("createdAt", 'Mon'), EXTRACT(MONTH FROM "createdAt")
      ORDER BY "monthNum" ASC
    `);

    const neonatalTrends = await this.neonatalRepo.manager.query(`
      SELECT
        TO_CHAR("createdAt", 'Mon') AS month,
        EXTRACT(MONTH FROM "createdAt")::int AS "monthNum",
        COUNT(*)::int AS count
      FROM neonatal_patients
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR("createdAt", 'Mon'), EXTRACT(MONTH FROM "createdAt")
      ORDER BY "monthNum" ASC
    `);

    return { prenatal: prenatalTrends, neonatal: neonatalTrends };
  }

  async getRiskDistribution() {
    const distribution = await this.riskRepo
      .createQueryBuilder('r')
      .select('r.riskLevel', 'riskLevel')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.riskLevel')
      .getRawMany();

    return distribution;
  }

  async getHighRiskCases() {
    return this.riskRepo.find({
      where: [{ riskLevel: RiskLevel.HIGH }, { riskLevel: RiskLevel.CRITICAL }],
      relations: ['submittedBy'],
      order: { submittedAt: 'DESC' },
      take: 50,
    });
  }

  async getDistrictStats(district: string) {
    const [prenatal, neonatal] = await Promise.all([
      this.prenatalRepo.count({ where: { district } }),
      this.neonatalRepo.count({ where: { district } }),
    ]);

    const highRisk = await this.riskRepo
      .createQueryBuilder('r')
      .innerJoin(PrenatalPatient, 'p', 'p.id = r.patientId AND p.district = :district', { district })
      .where("r.riskLevel IN ('High Risk', 'Seek Help Immediately')")
      .getCount();

    return { district, prenatal, neonatal, total: prenatal + neonatal, highRisk };
  }

  async getAllDistrictStats() {
    const districts = await this.prenatalRepo
      .createQueryBuilder('p')
      .select('p.district', 'district')
      .addSelect('COUNT(*)', 'prenatal')
      .where('p.district IS NOT NULL')
      .groupBy('p.district')
      .getRawMany();

    return districts;
  }

  /**
   * System Alerts — detects anomalies for the admin dashboard panel.
   * Covers: inactive clinicians, high-risk spikes, overdue appointments.
   */
  async getSystemAlerts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clinicians with no activity in 30+ days
    const inactiveClinicians = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: 'clinician' })
      .andWhere('u.isActive = true')
      .andWhere('(u.lastActiveAt IS NULL OR u.lastActiveAt < :cutoff)', {
        cutoff: thirtyDaysAgo,
      })
      .getCount();

    // High-risk cases this week vs last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [thisWeekHigh, lastWeekHigh] = await Promise.all([
      this.riskRepo.createQueryBuilder('r')
        .where("r.riskLevel IN ('High Risk', 'Seek Help Immediately')")
        .andWhere('r.submittedAt >= :from', { from: oneWeekAgo })
        .getCount(),
      this.riskRepo.createQueryBuilder('r')
        .where("r.riskLevel IN ('High Risk', 'Seek Help Immediately')")
        .andWhere('r.submittedAt >= :from AND r.submittedAt < :to', {
          from: twoWeeksAgo, to: oneWeekAgo,
        })
        .getCount(),
    ]);

    const highRiskSpike = lastWeekHigh > 0
      ? Math.round(((thisWeekHigh - lastWeekHigh) / lastWeekHigh) * 100)
      : thisWeekHigh > 0 ? 100 : 0;

    // Active unattended alerts
    const activeAlerts = await this.alertsRepo.count({ where: { attended: false } });

    return {
      inactiveClinicians,
      highRiskSpike,
      thisWeekHighRisk: thisWeekHigh,
      activeAlerts,
      alerts: [
        ...(inactiveClinicians > 0
          ? [{ type: 'warning', message: `${inactiveClinicians} clinician(s) inactive for 30+ days` }]
          : []),
        ...(highRiskSpike > 10
          ? [{ type: 'critical', message: `High-risk cases up ${highRiskSpike}% this week` }]
          : []),
        ...(activeAlerts > 0
          ? [{ type: 'info', message: `${activeAlerts} active patient alert(s) pending` }]
          : []),
      ],
    };
  }



  /**
   * Task Analytics — appointment completion tracking.
   */
  async getTaskAnalytics() {
    const [total, completed, cancelled] = await Promise.all([
      this.alertsRepo.manager.query(
        `SELECT COUNT(*) as count FROM appointments`,
      ),
      this.alertsRepo.manager.query(
        `SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'`,
      ),
      this.alertsRepo.manager.query(
        `SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'`,
      ),
    ]);

    const totalCount = parseInt(total[0]?.count ?? '0', 10);
    const completedCount = parseInt(completed[0]?.count ?? '0', 10);
    const cancelledCount = parseInt(cancelled[0]?.count ?? '0', 10);
    const pendingCount = totalCount - completedCount - cancelledCount;
    const completionRate = totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

    return {
      total: totalCount,
      completed: completedCount,
      cancelled: cancelledCount,
      pending: pendingCount,
      completionRate,
      missedRate: totalCount > 0 ? Math.round((cancelledCount / totalCount) * 100) : 0,
    };
  }
}
