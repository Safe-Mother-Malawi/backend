import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum VaccineStatus {
  GIVEN     = 'given',
  UPCOMING  = 'upcoming',
  SCHEDULED = 'scheduled',
}

@Entity('vaccines')
export class Vaccine {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) neonatalPatientId: string;
  @Column({ type: 'varchar' }) name: string;
  @Column({ type: 'varchar' }) ageLabel: string;
  @Column({ type: 'int' }) dueDayAge: number;

  @Column({ type: 'enum', enum: VaccineStatus, default: VaccineStatus.SCHEDULED })
  status: VaccineStatus;

  @Column({ type: 'varchar', nullable: true }) givenDate: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
