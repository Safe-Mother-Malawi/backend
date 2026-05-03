import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  ALERT = 'alert',
  APPOINTMENT = 'appointment',
  INFO = 'info',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) title: string;
  @Column({ type: 'text' }) body: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.INFO })
  type: NotificationType;

  @Column({ type: 'boolean', default: false }) read: boolean;

  @Column({ type: 'varchar' }) userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn() createdAt: Date;
}
