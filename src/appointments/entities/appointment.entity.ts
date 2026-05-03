import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AppointmentType {
  PRENATAL = 'prenatal',
  NEONATAL = 'neonatal',
  OTHER = 'other',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) title: string;
  @Column({ type: 'varchar' }) patientName: string;
  @Column({ type: 'varchar' }) patientContact: string;
  @Column({ type: 'varchar', nullable: true }) patientStatus: string | null;

  @Column({ type: 'enum', enum: AppointmentType, default: AppointmentType.OTHER })
  type: AppointmentType;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @Column({ type: 'date' }) date: string;
  @Column({ type: 'varchar', nullable: true }) time: string | null;
  @Column({ type: 'varchar', nullable: true }) location: string | null;
  @Column({ type: 'varchar', nullable: true }) doctor: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;

  @Column({ type: 'varchar', nullable: true }) prenatalPatientId: string | null;
  @Column({ type: 'varchar', nullable: true }) neonatalPatientId: string | null;
  @Column({ type: 'varchar', nullable: true }) createdById: string | null;
  @Column({ type: 'varchar', nullable: true }) clinicianId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clinicianId' })
  clinician: User | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
