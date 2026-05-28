import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ActivityAction {
  // User actions
  USER_REGISTERED   = 'user.registered',
  USER_LOGIN        = 'user.login',
  USER_LOGOUT       = 'user.logout',
  USER_CREATED      = 'user.created',
  USER_DELETED      = 'user.deleted',
  USER_ACTIVATED    = 'user.activated',
  USER_DEACTIVATED  = 'user.deactivated',
  
  // Patient actions
  PATIENT_CREATED   = 'patient.created',
  PATIENT_UPDATED   = 'patient.updated',
  PATIENT_DELETED   = 'patient.deleted',
  PATIENT_VIEWED    = 'patient.viewed',
  PATIENT_LINKED    = 'patient.linked',
  
  // Risk assessment actions
  RISK_SUBMITTED    = 'risk.submitted',
  RISK_HIGH_FLAGGED = 'risk.high_flagged',
  
  // Health check actions
  HEALTH_CHECK_SUBMITTED = 'health_check.submitted',
  HEALTH_CHECK_DELETED   = 'health_check.deleted',
  
  // Appointment actions
  APPOINTMENT_CREATED   = 'appointment.created',
  APPOINTMENT_UPDATED   = 'appointment.updated',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  
  // Alert actions
  ALERT_CREATED  = 'alert.created',
  ALERT_ATTENDED = 'alert.attended',
  
  // Vaccine actions
  VACCINE_GIVEN  = 'vaccine.given',
  
  // Feeding/Sleep actions
  FEEDING_LOGGED = 'feeding.logged',
  SLEEP_LOGGED   = 'sleep.logged',
  
  // Health facility actions
  FACILITY_CREATED = 'facility.created',
  FACILITY_UPDATED = 'facility.updated',
  FACILITY_DELETED = 'facility.deleted',
  
  // Report actions
  REPORT_GENERATED = 'report.generated',
  REPORT_DOWNLOADED = 'report.downloaded',
  REPORT_EXPORTED = 'report.exported',
  
  // Referral actions
  REFERRAL_CREATED = 'referral.created',
  REFERRAL_ACCEPTED = 'referral.accepted',
  REFERRAL_REJECTED = 'referral.rejected',
  REFERRAL_UPDATED = 'referral.updated',
  REFERRAL_COMPLETED = 'referral.completed',
  REFERRAL_CANCELLED = 'referral.cancelled',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'enum', enum: ActivityAction })
  action: ActivityAction;

  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'varchar', nullable: true }) actorId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorId' })
  actor: User | null;

  @Column({ type: 'varchar', nullable: true }) resourceType: string | null;
  @Column({ type: 'varchar', nullable: true }) resourceId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;

  @CreateDateColumn() createdAt: Date;
}
