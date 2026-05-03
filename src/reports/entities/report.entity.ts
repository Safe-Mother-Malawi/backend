import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportType {
  DISTRICT_SUMMARY = 'District Summary',
  RISK_REPORT      = 'Risk Report',
  TASK_REPORT      = 'Task Report',
  CLINICIAN_REPORT = 'Clinician Report',
  FULL_SYSTEM      = 'Full System Report',
  IVR_REPORT       = 'IVR Report',
}

export enum ReportFormat {
  PDF   = 'PDF',
  CSV   = 'CSV',
  EXCEL = 'Excel',
  JSON  = 'JSON',
}

export enum ReportStatus {
  READY    = 'Ready',
  ARCHIVED = 'Archived',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) name: string;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ type: 'enum', enum: ReportFormat, default: ReportFormat.PDF })
  format: ReportFormat;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.READY })
  status: ReportStatus;

  @Column({ type: 'varchar', nullable: true }) district: string | null;
  @Column({ type: 'varchar', nullable: true }) dateFrom: string | null;
  @Column({ type: 'varchar', nullable: true }) dateTo: string | null;

  // Snapshot of the data at generation time
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true }) generatedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'generatedById' })
  generatedBy: User | null;

  @CreateDateColumn() createdAt: Date;
}
