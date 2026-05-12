import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentType, AppointmentStatus, ANCVisitType } from '../entities/appointment.entity';
import { PrenatalPatient } from '../../patients/entities/prenatal-patient.entity';

export interface ANCScheduleRecommendation {
  visitNumber: number;
  recommendedWeeks: number;
  visitType: ANCVisitType;
  description: string;
  isOverdue?: boolean;
  daysPastDue?: number;
}

export interface ANCComplianceReport {
  patientId: string;
  patientName: string;
  gestationalWeeks: number;
  totalANCVisits: number;
  completedVisits: number;
  missedVisits: number;
  complianceRate: number;
  nextRecommendedVisit: ANCScheduleRecommendation | null;
  isHighRisk: boolean;
  lastVisitDate: string | null;
}

@Injectable()
export class ANCTrackingService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(PrenatalPatient)
    private readonly prenatalRepo: Repository<PrenatalPatient>,
  ) {}

  /**
   * WHO/Malawi ANC Schedule Recommendations:
   * - 1st visit: 8-12 weeks
   * - 2nd visit: 20-24 weeks  
   * - 3rd visit: 28-32 weeks
   * - 4th visit: 36-38 weeks
   * - Additional visits for high-risk pregnancies
   */
  private getANCSchedule(): ANCScheduleRecommendation[] {
    return [
      {
        visitNumber: 1,
        recommendedWeeks: 10,
        visitType: ANCVisitType.FIRST_VISIT,
        description: 'First ANC visit - Initial assessment, blood tests, health education',
      },
      {
        visitNumber: 2,
        recommendedWeeks: 22,
        visitType: ANCVisitType.FOLLOW_UP,
        description: 'Second ANC visit - Growth monitoring, ultrasound, nutrition counseling',
      },
      {
        visitNumber: 3,
        recommendedWeeks: 30,
        visitType: ANCVisitType.FOLLOW_UP,
        description: 'Third ANC visit - Blood pressure monitoring, fetal position assessment',
      },
      {
        visitNumber: 4,
        recommendedWeeks: 37,
        visitType: ANCVisitType.FOLLOW_UP,
        description: 'Fourth ANC visit - Birth preparedness, delivery planning',
      },
    ];
  }

  /**
   * Calculate gestational weeks from LMP date
   */
  private calculateGestationalWeeks(lmpDate: string): number {
    const lmp = new Date(lmpDate);
    const now = new Date();
    const diffTime = now.getTime() - lmp.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, diffWeeks);
  }

  /**
   * Create ANC appointment with proper tracking fields
   */
  async createANCAppointment(data: {
    patientId: string;
    patientName: string;
    patientContact: string;
    date: string;
    time?: string;
    location?: string;
    clinicianId?: string;
    visitType: ANCVisitType;
    visitNumber?: number;
    gestationalWeeks?: number;
    notes?: string;
  }): Promise<Appointment> {
    const appointment = this.appointmentRepo.create({
      title: `ANC Visit ${data.visitNumber || ''} - ${data.patientName}`,
      patientName: data.patientName,
      patientContact: data.patientContact,
      type: AppointmentType.ANC,
      status: AppointmentStatus.SCHEDULED,
      date: data.date,
      time: data.time,
      location: data.location,
      clinicianId: data.clinicianId,
      prenatalPatientId: data.patientId,
      ancVisitType: data.visitType,
      ancVisitNumber: data.visitNumber,
      gestationalWeeks: data.gestationalWeeks,
      notes: data.notes,
      isANCCompliant: this.isVisitCompliant(data.gestationalWeeks || 0, data.visitNumber || 1),
    });

    return this.appointmentRepo.save(appointment);
  }

  /**
   * Mark ANC appointment as attended
   */
  async markANCAttended(appointmentId: string, attendanceNotes?: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    appointment.attendedAt = new Date();
    appointment.attendanceNotes = attendanceNotes || null;

    return this.appointmentRepo.save(appointment);
  }

  /**
   * Mark ANC appointment as no-show
   */
  async markANCNoShow(appointmentId: string, reason?: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = AppointmentStatus.NO_SHOW;
    appointment.attendanceNotes = reason || 'Patient did not attend scheduled appointment';

    return this.appointmentRepo.save(appointment);
  }

  /**
   * Check if a visit is compliant with ANC schedule
   */
  private isVisitCompliant(gestationalWeeks: number, visitNumber: number): boolean {
    const schedule = this.getANCSchedule();
    const recommendedVisit = schedule.find(v => v.visitNumber === visitNumber);
    
    if (!recommendedVisit) return false;

    // Allow ±2 weeks flexibility
    const minWeeks = recommendedVisit.recommendedWeeks - 2;
    const maxWeeks = recommendedVisit.recommendedWeeks + 2;
    
    return gestationalWeeks >= minWeeks && gestationalWeeks <= maxWeeks;
  }

  /**
   * Get ANC compliance report for a specific patient
   */
  async getPatientANCCompliance(patientId: string): Promise<ANCComplianceReport> {
    const patient = await this.prenatalRepo.findOne({ where: { id: patientId } });
    if (!patient) {
      throw new Error('Patient not found');
    }

    const ancAppointments = await this.appointmentRepo.find({
      where: { 
        prenatalPatientId: patientId,
        type: AppointmentType.ANC,
      },
      order: { date: 'ASC' },
    });

    const currentWeeks = patient.lmpDate 
      ? this.calculateGestationalWeeks(patient.lmpDate)
      : parseInt(patient.pregnancyWeeks || '0', 10);

    const completedVisits = ancAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const missedVisits = ancAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
    const totalScheduled = ancAppointments.length;

    const complianceRate = totalScheduled > 0 ? (completedVisits / totalScheduled) * 100 : 0;

    // Determine next recommended visit
    const nextRecommendedVisit = this.getNextRecommendedVisit(currentWeeks, completedVisits + 1);

    const lastCompletedVisit = ancAppointments
      .filter(a => a.status === AppointmentStatus.COMPLETED)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      patientId,
      patientName: patient.fullName,
      gestationalWeeks: currentWeeks,
      totalANCVisits: totalScheduled,
      completedVisits,
      missedVisits,
      complianceRate: Math.round(complianceRate),
      nextRecommendedVisit,
      isHighRisk: complianceRate < 75 || missedVisits > 1,
      lastVisitDate: lastCompletedVisit?.date || null,
    };
  }

  /**
   * Get next recommended ANC visit based on current gestational weeks
   */
  private getNextRecommendedVisit(currentWeeks: number, nextVisitNumber: number): ANCScheduleRecommendation | null {
    const schedule = this.getANCSchedule();
    const nextVisit = schedule.find(v => v.visitNumber === nextVisitNumber);
    
    if (!nextVisit) return null;

    const isOverdue = currentWeeks > (nextVisit.recommendedWeeks + 2);
    const daysPastDue = isOverdue 
      ? Math.floor((currentWeeks - nextVisit.recommendedWeeks) * 7)
      : 0;

    return {
      ...nextVisit,
      isOverdue,
      daysPastDue,
    };
  }

  /**
   * Get ANC attendance statistics for analytics
   */
  async getANCAttendanceStats(filters?: {
    district?: string;
    facilityName?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalANCAppointments: number;
    attendedAppointments: number;
    missedAppointments: number;
    attendanceRate: number;
    complianceRate: number;
    averageVisitsPerPatient: number;
  }> {
    let query = this.appointmentRepo.createQueryBuilder('a')
      .where('a.type = :type', { type: AppointmentType.ANC });

    if (filters?.startDate) {
      query = query.andWhere('a.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query = query.andWhere('a.date <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.district || filters?.facilityName) {
      query = query.innerJoin(PrenatalPatient, 'p', 'p.id = a.prenatalPatientId');
      
      if (filters.district) {
        query = query.andWhere('p.district = :district', { district: filters.district });
      }
      
      if (filters.facilityName) {
        query = query.andWhere('p.facilityName = :facilityName', { facilityName: filters.facilityName });
      }
    }

    const allAppointments = await query.getMany();
    
    const totalAppointments = allAppointments.length;
    const attendedAppointments = allAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const missedAppointments = allAppointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
    const compliantAppointments = allAppointments.filter(a => a.isANCCompliant).length;

    const attendanceRate = totalAppointments > 0 ? (attendedAppointments / totalAppointments) * 100 : 0;
    const complianceRate = totalAppointments > 0 ? (compliantAppointments / totalAppointments) * 100 : 0;

    // Calculate average visits per patient
    const uniquePatients = new Set(allAppointments.map(a => a.prenatalPatientId)).size;
    const averageVisitsPerPatient = uniquePatients > 0 ? totalAppointments / uniquePatients : 0;

    return {
      totalANCAppointments: totalAppointments,
      attendedAppointments,
      missedAppointments,
      attendanceRate: Math.round(attendanceRate),
      complianceRate: Math.round(complianceRate),
      averageVisitsPerPatient: Math.round(averageVisitsPerPatient * 10) / 10,
    };
  }

  /**
   * Get list of patients with poor ANC compliance for follow-up
   */
  async getPatientsWithPoorCompliance(district?: string): Promise<ANCComplianceReport[]> {
    let query = this.prenatalRepo.createQueryBuilder('p');
    
    if (district) {
      query = query.where('p.district = :district', { district });
    }

    const patients = await query.getMany();
    const complianceReports: ANCComplianceReport[] = [];

    for (const patient of patients) {
      try {
        const compliance = await this.getPatientANCCompliance(patient.id);
        if (compliance.complianceRate < 75 || compliance.missedVisits > 1) {
          complianceReports.push(compliance);
        }
      } catch (error) {
        // Skip patients with errors
        continue;
      }
    }

    return complianceReports.sort((a, b) => a.complianceRate - b.complianceRate);
  }

  /**
   * Generate ANC schedule recommendations for a patient
   */
  async generateANCScheduleForPatient(patientId: string): Promise<ANCScheduleRecommendation[]> {
    const patient = await this.prenatalRepo.findOne({ where: { id: patientId } });
    if (!patient) {
      throw new Error('Patient not found');
    }

    const currentWeeks = patient.lmpDate 
      ? this.calculateGestationalWeeks(patient.lmpDate)
      : parseInt(patient.pregnancyWeeks || '0', 10);

    const existingAppointments = await this.appointmentRepo.find({
      where: { 
        prenatalPatientId: patientId,
        type: AppointmentType.ANC,
        status: AppointmentStatus.COMPLETED,
      },
    });

    const completedVisitNumbers = existingAppointments.map(a => a.ancVisitNumber).filter(Boolean);
    const schedule = this.getANCSchedule();

    return schedule.map(visit => {
      const isCompleted = completedVisitNumbers.includes(visit.visitNumber);
      const isOverdue = currentWeeks > (visit.recommendedWeeks + 2) && !isCompleted;
      const daysPastDue = isOverdue 
        ? Math.floor((currentWeeks - visit.recommendedWeeks) * 7)
        : 0;

      return {
        ...visit,
        isOverdue,
        daysPastDue,
      };
    });
  }
}