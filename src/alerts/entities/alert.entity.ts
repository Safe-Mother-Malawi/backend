import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) patientName: string;
  @Column({ type: 'varchar' }) patientStatus: string;
  @Column({ type: 'varchar' }) contact: string;
  @Column({ type: 'text' }) reason: string;

  @Column({ type: 'simple-array', nullable: true })
  symptoms: string[] | null;

  @Column({ type: 'enum', enum: AlertSeverity, default: AlertSeverity.HIGH })
  severity: AlertSeverity;

  @Column({ type: 'boolean', default: false }) attended: boolean;

  @Column({ type: 'varchar', nullable: true }) patientId: string | null;
  @Column({ type: 'varchar', nullable: true }) clinicianId: string | null;

  /** Patient's district — used to route the alert to the right clinicians */
  @Column({ type: 'varchar', nullable: true }) district: string | null;

  /** Patient's health facility — used to route the alert to the right clinicians */
  @Column({ type: 'varchar', nullable: true, name: 'healthCentre' }) facilityName: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clinicianId' })
  clinician: User | null;

  @CreateDateColumn() createdAt: Date;
}
