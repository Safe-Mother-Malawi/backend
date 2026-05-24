import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationType } from './notification.entity';

@Entity('broadcast_messages')
export class BroadcastMessage {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) title: string;
  @Column({ type: 'text' }) body: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.INFO })
  type: NotificationType;

  @Column({ type: 'varchar' })
  broadcastType: string; // 'all', 'role', 'district', 'users'

  @Column({ type: 'varchar', nullable: true })
  targetRole: string | null; // For role-based broadcasts

  @Column({ type: 'varchar', nullable: true })
  targetDistrict: string | null; // For district-based broadcasts

  @Column({ type: 'int' })
  recipientCount: number; // Number of users who received this message

  @Column({ type: 'uuid' })
  sentBy: string; // Admin who sent the message

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sentBy' })
  admin: User;

  @CreateDateColumn() createdAt: Date;
}
