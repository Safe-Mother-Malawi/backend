import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { PrenatalPatient } from './prenatal-patient.entity';
import { NeonatalVisit } from './neonatal-visit.entity';

@Entity('neonatal_patients')
export class NeonatalPatient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PrenatalPatient, (prenatal) => prenatal.neonatalRecords, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'prenatal_patient_id' })
  prenatalPatient: PrenatalPatient | null;

  @Column({ name: 'prenatal_patient_id', nullable: true })
  prenatalPatientId: string | null;

  // Baby Information
  @Column({ type: 'varchar', length: 100 })
  babyName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  babyGender: string | null; // 'Male', 'Female'

  @Column({ type: 'timestamp' })
  dateOfBirth: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  birthWeight: number; // in kg

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  birthLength: number; // in cm

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  headCircumference: number; // in cm

  @Column({ type: 'varchar', length: 50, nullable: true })
  deliveryMode: string; // 'Vaginal', 'Cesarean', 'Assisted'

  @Column({ type: 'varchar', length: 50, nullable: true })
  deliveryPlace: string; // 'Health facility', 'Home', 'Other'

  @Column({ type: 'text', nullable: true })
  deliveryComplications: string;

  // Neonatal Screening Results
  @Column({ type: 'varchar', length: 50, nullable: true })
  apgarScore1Min: string; // Apgar score at 1 minute

  @Column({ type: 'varchar', length: 50, nullable: true })
  apgarScore5Min: string; // Apgar score at 5 minutes

  @Column({ type: 'boolean', default: false })
  birthDefectsScreened: boolean;

  @Column({ type: 'text', nullable: true })
  birthDefectsFindings: string;

  @Column({ type: 'boolean', default: false })
  hearingScreened: boolean;

  @Column({ type: 'text', nullable: true })
  hearingScreeningResults: string;

  @Column({ type: 'boolean', default: false })
  metabolicScreened: boolean;

  @Column({ type: 'text', nullable: true })
  metabolicScreeningResults: string;

  // Feeding Information
  @Column({ type: 'varchar', length: 50, nullable: true })
  feedingType: string; // 'Exclusive breastfeeding', 'Formula', 'Mixed'

  @Column({ type: 'boolean', default: false })
  breastfeedingInitiated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  breastfeedingInitiatedTime: Date;

  @Column({ type: 'text', nullable: true })
  feedingChallenges: string;

  // Immunization Information
  @Column({ type: 'simple-array', nullable: true })
  immunizationsGiven: string[]; // Array of vaccine names

  @Column({ type: 'timestamp', nullable: true })
  bcgVaccineDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  opv0VaccineDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  vitaminKDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  eyeProphylaxisDate: Date;

  // Health Status
  @Column({ type: 'varchar', length: 50, default: 'Healthy' })
  currentHealthStatus: string; // 'Healthy', 'At risk', 'Sick', 'Hospitalized'

  @Column({ type: 'text', nullable: true })
  healthConcerns: string;

  @Column({ type: 'boolean', default: false })
  jaundicePresent: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  jaundiceLevel: string; // 'Mild', 'Moderate', 'Severe'

  @Column({ type: 'boolean', default: false })
  umbilicalCordInfection: boolean;

  @Column({ type: 'boolean', default: false })
  skinInfection: boolean;

  @Column({ type: 'text', nullable: true })
  otherHealthIssues: string;

  // Follow-up Information
  @Column({ type: 'varchar', length: 50, default: 'Pending' })
  followUpStatus: string; // 'Pending', 'Scheduled', 'Completed', 'Missed'

  @Column({ type: 'timestamp', nullable: true })
  nextFollowUpDate: Date;

  @Column({ type: 'text', nullable: true })
  followUpNotes: string;

  // Risk Assessment
  @Column({ type: 'boolean', default: false })
  riskFlagRaised: boolean;

  @Column({ type: 'text', nullable: true })
  riskAssessment: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  riskLevel: string; // 'Low', 'Medium', 'High', 'Critical'

  // Clinician Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  clinicianName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  clinicianPhone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  healthFacility: string;

  // Mother Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  motherName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  motherPhone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  motherEmail: string | null;

  // User Link
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  // Location Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  facilityName: string | null;

  // Patient Status
  @Column({ type: 'varchar', length: 50, default: 'alive' })
  patientStatus: string; // 'alive', 'deceased'

  // Relationships
  @OneToMany(() => NeonatalVisit, (visit) => visit.neonatalPatient, {
    cascade: true,
  })
  visits: NeonatalVisit[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
