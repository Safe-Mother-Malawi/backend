import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationType } from './notification.entity';

export enum BroadcastStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('broadcast_messages')
export class BroadcastMessage {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) title: string;
  @Column({ type: 'text' }) body: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.INFO })
  type: NotificationType;

  @Column({ type: 'varchar' })
  broadcastType: string; // 'all', 'role', 'district', 'facility', 'users'

  @Column({ type: 'varchar', nullable: true })
  targetRole: string | null; // For role-based broadcasts

  @Column({ type: 'varchar', nullable: true })
  targetDistrict: string | null; // For district-based broadcasts

  @Column({ type: 'varchar', nullable: true })
  targetFacilityId: string | null; // For facility-based broadcasts

  @Column({ type: 'simple-array', nullable: true })
  targetUserIds: string[] | null; // For specific users broadcasts

  @Column({ type: 'simple-array', default: 'in-app' })
  deliveryChannels: string[]; // 'in-app', 'push', 'sms', 'email'

  @Column({ type: 'enum', enum: BroadcastStatus, default: BroadcastStatus.SENT })
  status: BroadcastStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'int', default: 0 })
  recipientCount: number; // Number of users who received this message

  @Column({ type: 'int', default: 0 })
  deliveredCount: number; // Successfully delivered (if tracking)

  @Column({ type: 'int', default: 0 })
  readCount: number; // Read by users

  @Column({ type: 'int', default: 0 })
  failedCount: number; // Failed deliveries

  @Column({ type: 'uuid', nullable: true })
  sentBy: string | null; // Admin who sent the message

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sentBy' })
  admin: User;

  @CreateDateColumn() createdAt: Date;
}
