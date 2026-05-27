import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AppointmentType {
  PRENATAL = 'prenatal',
  NEONATAL = 'neonatal',
  ANC = 'anc', // Antenatal Care specific
  OTHER = 'other',
}

export enum AppointmentStatus {
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED = 'confirmed',
  PATIENT_UNAVAILABLE = 'patient_unavailable',
  RESCHEDULE_REQUESTED = 'reschedule_requested',
  MISSED = 'missed',
  FOLLOW_UP_REQUIRED = 'follow_up_required',
  URGENT_ATTENTION_REQUIRED = 'urgent_attention_required',
  COMPLETED = 'completed',
  NO_RESPONSE = 'no_response',
  AT_RISK_NON_RESPONSIVE = 'at_risk_non_responsive',
  CANCELLED = 'cancelled',
  SCHEDULED = 'scheduled', // Compatibility fallback
  NO_SHOW = 'no_show', // Compatibility fallback
}

export enum ANCVisitType {
  FIRST_VISIT = 'first_visit',
  FOLLOW_UP = 'follow_up',
  HIGH_RISK_FOLLOW_UP = 'high_risk_follow_up',
  EMERGENCY = 'emergency',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) title: string;
  @Column({ type: 'varchar' }) patientName: string;
  @Column({ type: 'varchar' }) patientContact: string;
  @Column({ type: 'varchar', nullable: true }) patientStatus: string | null;

  @Column({ type: 'enum', enum: AppointmentType, default: AppointmentType.OTHER })
  type: AppointmentType;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.PENDING_CONFIRMATION })
  status: AppointmentStatus;

  @Column({ type: 'date' }) date: string;
  @Column({ type: 'varchar', nullable: true }) time: string | null;
  @Column({ type: 'varchar', nullable: true }) location: string | null;
  @Column({ type: 'varchar', nullable: true }) doctor: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;

  // ANC-specific fields
  @Column({ type: 'enum', enum: ANCVisitType, nullable: true })
  ancVisitType: ANCVisitType | null;

  @Column({ type: 'int', nullable: true })
  ancVisitNumber: number | null; // 1st, 2nd, 3rd, 4th ANC visit

  @Column({ type: 'int', nullable: true })
  gestationalWeeks: number | null; // Weeks of pregnancy at appointment

  @Column({ type: 'boolean', default: false })
  isANCCompliant: boolean; // Whether this visit meets ANC schedule requirements

  @Column({ type: 'timestamp', nullable: true })
  attendedAt: Date | null; // When the appointment was actually attended

  @Column({ type: 'varchar', nullable: true })
  attendanceNotes: string | null; // Notes about attendance/non-attendance

  // Structured ANC visit data (vitals, labs, medications, danger signs)
  @Column({ type: 'jsonb', nullable: true })
  ancData: any | null;

  // Risk Engine assessment output for this visit
  @Column({ type: 'jsonb', nullable: true })
  riskResult: any | null;

  @Column({ type: 'varchar', nullable: true }) prenatalPatientId: string | null;
  @Column({ type: 'varchar', nullable: true }) neonatalPatientId: string | null;
  @Column({ type: 'varchar', nullable: true }) createdById: string | null;
  @Column({ type: 'varchar', nullable: true }) clinicianId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clinicianId' })
  clinician: User | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
