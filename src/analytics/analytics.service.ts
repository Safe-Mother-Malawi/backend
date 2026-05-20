import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';
import { RiskAssessment, RiskLevel } from '../risk-assessments/entities/risk-assessment.entity';
import { Appointment, AppointmentType, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { ANCTrackingService } from '../appointments/services/anc-tracking.service';

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
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Alert)
    private readonly alertsRepo: Repository<Alert>,
    @Inject(forwardRef(() => ANCTrackingService))
    private readonly ancService: ANCTrackingService,
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

  /**
   * ANC Attendance Analytics — specific tracking for antenatal care visits
   */
  async getANCAnalytics(district?: string) {
    try {
      // Get ANC-specific statistics
      const ancStats = await this.ancService.getANCAttendanceStats(
        district ? { district } : undefined
      );

      // Get ANC appointments by month for trends
      const ancTrends = await this.appointmentRepo.manager.query(`
        SELECT
          TO_CHAR("date", 'Mon') AS month,
          EXTRACT(MONTH FROM "date")::int AS "monthNum",
          COUNT(*)::int AS total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS attended,
          COUNT(CASE WHEN status = 'no_show' THEN 1 END)::int AS missed
        FROM appointments
        WHERE type = 'anc' AND "date" >= NOW() - INTERVAL '12 months'
        ${district ? `AND "prenatalPatientId" IN (
          SELECT id FROM prenatal_patients WHERE district = '${district}'
        )` : ''}
        GROUP BY TO_CHAR("date", 'Mon'), EXTRACT(MONTH FROM "date")
        ORDER BY "monthNum" ASC
      `);

      // Get compliance distribution
      const complianceDistribution = await this.appointmentRepo.manager.query(`
        SELECT
          CASE 
            WHEN "isANCCompliant" = true THEN 'Compliant'
            ELSE 'Non-Compliant'
          END as compliance_status,
          COUNT(*)::int as count
        FROM appointments
        WHERE type = 'anc'
        ${district ? `AND "prenatalPatientId" IN (
          SELECT id FROM prenatal_patients WHERE district = '${district}'
        )` : ''}
        GROUP BY "isANCCompliant"
      `);

      return {
        ...ancStats,
        monthlyTrends: ancTrends,
        complianceDistribution,
      };
    } catch (error) {
      // Fallback if ANC service is not available
      return {
        totalANCAppointments: 0,
        attendedAppointments: 0,
        missedAppointments: 0,
        attendanceRate: 0,
        complianceRate: 0,
        averageVisitsPerPatient: 0,
        monthlyTrends: [],
        complianceDistribution: [],
      };
    }
  }

  /**
   * Get ANC compliance summary for dashboard
   */
  async getANCComplianceSummary(district?: string) {
    try {
      const poorCompliancePatients = await this.ancService.getPatientsWithPoorCompliance(district);
      
      const totalPrenatalPatients = await this.prenatalRepo.count(
        district ? { where: { district } } : undefined
      );

      const highRiskPatients = poorCompliancePatients.filter(p => p.isHighRisk).length;
      const averageCompliance = poorCompliancePatients.length > 0
        ? Math.round(poorCompliancePatients.reduce((sum, p) => sum + p.complianceRate, 0) / poorCompliancePatients.length)
        : 100;

      return {
        totalPrenatalPatients,
        patientsWithPoorCompliance: poorCompliancePatients.length,
        highRiskPatients,
        averageComplianceRate: averageCompliance,
        complianceCategories: {
          excellent: poorCompliancePatients.filter(p => p.complianceRate >= 90).length,
          good: poorCompliancePatients.filter(p => p.complianceRate >= 75 && p.complianceRate < 90).length,
          fair: poorCompliancePatients.filter(p => p.complianceRate >= 50 && p.complianceRate < 75).length,
          poor: poorCompliancePatients.filter(p => p.complianceRate < 50).length,
        },
      };
    } catch (error) {
      return {
        totalPrenatalPatients: 0,
        patientsWithPoorCompliance: 0,
        highRiskPatients: 0,
        averageComplianceRate: 0,
        complianceCategories: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
        },
      };
    }
  }

  /**
   * Clinician Dashboard - specific operational care metrics for a clinician
   */
  async getClinicianDashboard(clinicianId: string) {
    const allPatients = await this.prenatalRepo.find({ where: { registeredById: clinicianId } });
    
    const activePregnancies = allPatients.length;

    const highRiskPregnancies = await this.riskRepo.createQueryBuilder('r')
      .innerJoin(PrenatalPatient, 'p', 'p.id = r.patientId')
      .where('p.registeredById = :clinicianId', { clinicianId })
      .andWhere("r.riskLevel IN ('High Risk', 'Seek Help Immediately')")
      .getCount();

    const missedVisits = await this.appointmentRepo.count({
      where: { clinicianId, status: AppointmentStatus.NO_SHOW },
    });

    const now = new Date();
    const dueCutoff14 = new Date(); dueCutoff14.setDate(now.getDate() + 14);
    const dueCutoff7 = new Date(); dueCutoff7.setDate(now.getDate() + 7);

    let dueDeliveries = 0;
    const nearTermMothers: PrenatalPatient[] = [];

    allPatients.forEach(p => {
      if (p.expectedDeliveryDate) {
        const edd = new Date(p.expectedDeliveryDate);
        if (!isNaN(edd.getTime())) {
          if (edd >= now && edd <= dueCutoff14) {
            dueDeliveries++;
          }
          if (edd >= now && edd <= dueCutoff7) {
            nearTermMothers.push(p);
          }
        }
      }
    });

    const recentAppointments = await this.appointmentRepo.find({
      where: { clinicianId, status: AppointmentStatus.COMPLETED },
      order: { date: 'DESC', createdAt: 'DESC' },
      take: 20,
    });

    const timeline = recentAppointments.map(appt => {
      const data = appt.ancData || {};
      let labs = '';
      if (data.labResults) {
        labs = Object.entries(data.labResults)
          .filter(([_, v]) => v && v !== 'Not Tested')
          .map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      const meds = data.medications ? data.medications.join(', ') : '';
      const flags = appt.riskResult?.clinicalFlags?.join(', ') || '';
      
      return {
        id: appt.id,
        date: appt.date,
        patientName: appt.patientName,
        title: appt.title,
        labs: labs || 'No labs recorded',
        medications: meds || 'No medications',
        riskFlags: flags || 'No high risk flags',
        riskCategory: appt.riskResult?.riskCategory || 'LOW_RISK'
      };
    });

    const alerts: any[] = [];
    
    // Add Danger Signs & Severe Hypertension
    recentAppointments.forEach(appt => {
      if (appt.riskResult?.requiresImmediateAction) {
        alerts.push({
          type: 'Danger Signs',
          patientName: appt.patientName,
          message: `Requires immediate action: ${appt.riskResult.clinicalFlags?.join(', ') || 'High risk detected'}`,
          severity: 'critical'
        });
      }
    });

    // Add missed visits to alerts
    const missedAppointments = await this.appointmentRepo.find({
      where: { clinicianId, status: AppointmentStatus.NO_SHOW },
      order: { date: 'DESC' },
      take: 10,
    });

    missedAppointments.forEach(a => {
      alerts.push({
        type: 'Missed Visit',
        patientName: a.patientName,
        message: `Missed ANC visit scheduled on ${a.date}`,
        severity: 'high'
      });
    });

    // Add near term mothers
    nearTermMothers.forEach(m => {
      alerts.push({
        type: 'Near Term',
        patientName: m.fullName,
        message: `Expected delivery date is ${m.expectedDeliveryDate}`,
        severity: 'warning'
      });
    });

    return {
      overview: {
        activePregnancies,
        highRiskPregnancies,
        missedVisits,
        dueDeliveries
      },
      timeline,
      alerts
    };
  }
}
