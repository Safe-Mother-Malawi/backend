import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ActivityAction {
  USER_REGISTERED   = 'user.registered',
  USER_LOGIN        = 'user.login',
  USER_LOGOUT       = 'user.logout',
  PATIENT_CREATED   = 'patient.created',
  PATIENT_UPDATED   = 'patient.updated',
  PATIENT_DELETED   = 'patient.deleted',
  PATIENT_LINKED    = 'patient.linked',
  RISK_SUBMITTED    = 'risk.submitted',
  RISK_HIGH_FLAGGED = 'risk.high_flagged',
  APPOINTMENT_CREATED   = 'appointment.created',
  APPOINTMENT_UPDATED   = 'appointment.updated',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  ALERT_CREATED  = 'alert.created',
  ALERT_ATTENDED = 'alert.attended',
  VACCINE_GIVEN  = 'vaccine.given',
  FEEDING_LOGGED = 'feeding.logged',
  SLEEP_LOGGED   = 'sleep.logged',
  USER_ACTIVATED   = 'user.activated',
  USER_DEACTIVATED = 'user.deactivated',
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
