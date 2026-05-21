import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReminderType {
  APPOINTMENT = 'appointment',
  IRON_TABLET = 'iron_tablet',
  ANC_VISIT = 'anc_visit',
  VACCINE = 'vaccine',
  PRENATAL_CHECKUP = 'prenatal_checkup',
  NEONATAL_CHECKUP = 'neonatal_checkup',
  CUSTOM = 'custom',
}

export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ReminderFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity('reminders')
@Index(['userId', 'status'])
@Index(['scheduledFor', 'status'])
@Index(['userId', 'type'])
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: ReminderType })
  type: ReminderType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: ReminderStatus, default: ReminderStatus.PENDING })
  status: ReminderStatus;

  @Column({ type: 'enum', enum: ReminderFrequency, default: ReminderFrequency.ONCE })
  frequency: ReminderFrequency;

  @Column({ type: 'timestamp' })
  scheduledFor: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  nextReminderAt: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  appointmentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  patientId: string | null;

  @Column({ type: 'boolean', default: false })
  acknowledged: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
