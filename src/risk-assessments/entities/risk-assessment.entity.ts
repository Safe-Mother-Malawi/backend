import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RiskLevel {
  LOW      = 'Low Risk',
  MODERATE = 'Moderate Risk',
  HIGH     = 'High Risk',
  CRITICAL = 'Seek Help Immediately',
}

export enum PatientType {
  PRENATAL = 'prenatal',
  NEONATAL = 'neonatal',
}

@Entity('risk_assessments')
export class RiskAssessment {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) patientId: string;
  @Column({ type: 'varchar' }) patientName: string;
  @Column({ type: 'varchar' }) patientPhone: string;

  @Column({ type: 'enum', enum: PatientType })
  patientType: PatientType;

  @Column({ type: 'enum', enum: RiskLevel })
  riskLevel: RiskLevel;

  @Column({ type: 'int' }) score: number;
  @Column({ type: 'text' }) message: string;

  @Column({ type: 'jsonb', nullable: true })
  answers: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true }) submittedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'submittedById' })
  submittedBy: User | null;

  @CreateDateColumn() submittedAt: Date;
}
