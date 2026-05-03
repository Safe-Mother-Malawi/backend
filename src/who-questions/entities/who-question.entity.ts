import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum PatientCategory {
  PRENATAL = 'prenatal',
  NEONATAL = 'neonatal',
}

export enum PregnancyStage {
  TRIMESTER_1 = 'trimester_1',
  TRIMESTER_2 = 'trimester_2',
  TRIMESTER_3 = 'trimester_3',
}

export enum NeonatalStage {
  EARLY = 'early_neonatal',  // 0–7 days
  LATE  = 'late_neonatal',   // 8–28 days
}

export type QuestionStage = PregnancyStage | NeonatalStage;

export enum SeverityTag {
  HIGH   = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW    = 'LOW',
}

@Entity('who_questions')
export class WhoQuestion {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: 'varchar' }) stage: string;           // trimester_1 | trimester_2 | trimester_3 | early_neonatal | late_neonatal
  @Column({ type: 'varchar' }) category: string;        // prenatal | neonatal
  @Column({ type: 'text' })    questionText: string;
  @Column({ type: 'float' })   weight: number;          // YES answer weight
  @Column({ type: 'varchar', nullable: true }) severityTag: string | null;  // HIGH | MEDIUM | LOW
  @Column({ type: 'boolean', default: true }) isActive: boolean;
}
