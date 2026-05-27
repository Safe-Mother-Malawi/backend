import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Appointment } from './appointment.entity';

export enum BusyReason {
  WORK_CONFLICT = 'work_conflict',
  HEALTH_ISSUE = 'health_issue',
  TRANSPORTATION = 'transportation',
  FAMILY_EMERGENCY = 'family_emergency',
  FORGOT = 'forgot',
  OTHER = 'other',
}

@Entity('busy_responses')
export class BusyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  appointmentId: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: BusyReason, default: BusyReason.OTHER })
  reason: BusyReason;

  @Column({ type: 'text', nullable: true })
  additionalNotes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ type: 'boolean', default: false })
  rescheduleRequested: boolean;

  @Column({ type: 'timestamp', nullable: true })
  preferredRescheduleDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  preferredRescheduleTime: string | null;

  @Column({ type: 'boolean', default: false })
  clinicianNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  clinicianNotifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
