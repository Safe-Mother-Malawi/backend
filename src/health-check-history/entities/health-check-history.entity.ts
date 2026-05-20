import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum HealthCheckType {
  PRENATAL = 'prenatal',
  NEONATAL = 'neonatal',
}

export enum HealthCheckRiskLevel {
  LOW = 'Low Risk',
  MODERATE = 'Moderate Risk',
  HIGH = 'High Risk',
  CRITICAL = 'Seek Help Immediately',
}

@Entity('health_check_history')
@Index('idx_user_date', ['userId', 'createdAt'])
@Index('idx_user_type', ['userId', 'type'])
export class HealthCheckHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: HealthCheckType })
  type: HealthCheckType;

  @Column({ type: 'enum', enum: HealthCheckRiskLevel })
  riskLevel: HealthCheckRiskLevel;

  @Column({ type: 'float' })
  score: number;

  @Column({ type: 'float' })
  maxScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  symptoms: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  answers: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  submittedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'submittedById' })
  submittedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
