import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { NeonatalPatient } from './neonatal-patient.entity';

@Entity('neonatal_visits')
export class NeonatalVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => NeonatalPatient, (patient) => patient.visits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'neonatal_patient_id' })
  neonatalPatient: NeonatalPatient;

  @Column({ name: 'neonatal_patient_id' })
  neonatalPatientId: string;

  // Visit Information
  @Column({ type: 'int' })
  visitNumber: number; // 1-5 for WHO schedule

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status: string; // 'scheduled', 'completed', 'missed', 'rescheduled'

  // Vital Signs
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number; // in kg

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  length: number; // in cm

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  headCircumference: number; // in cm

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  temperature: number; // in Celsius

  @Column({ type: 'int', nullable: true })
  heartRate: number; // beats per minute

  @Column({ type: 'int', nullable: true })
  respiratoryRate: number; // breaths per minute

  // Physical Examination
  @Column({ type: 'text', nullable: true })
  generalAppearance: string;

  @Column({ type: 'text', nullable: true })
  skinExamination: string;

  @Column({ type: 'text', nullable: true })
  umbilicalCordStatus: string;

  @Column({ type: 'text', nullable: true })
  eyeExamination: string;

  @Column({ type: 'text', nullable: true })
  earExamination: string;

  @Column({ type: 'text', nullable: true })
  mouthExamination: string;

  @Column({ type: 'text', nullable: true })
  chestExamination: string;

  @Column({ type: 'text', nullable: true })
  abdominalExamination: string;

  @Column({ type: 'text', nullable: true })
  genitalsExamination: string;

  @Column({ type: 'text', nullable: true })
  extremitiesExamination: string;

  @Column({ type: 'text', nullable: true })
  neurologicalExamination: string;

  // Jaundice Assessment
  @Column({ type: 'boolean', default: false })
  jaundicePresent: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  jaundiceLevel: string; // 'Mild', 'Moderate', 'Severe'

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  bilirubinLevel: number; // in mg/dL

  // Feeding Assessment
  @Column({ type: 'varchar', length: 50, nullable: true })
  feedingType: string; // 'Breastfeeding', 'Formula', 'Mixed'

  @Column({ type: 'boolean', default: false })
  feedingWellEstablished: boolean;

  @Column({ type: 'text', nullable: true })
  feedingChallenges: string;

  @Column({ type: 'text', nullable: true })
  feedingRecommendations: string;

  // Immunizations Given
  @Column({ type: 'simple-array', nullable: true })
  immunizationsGiven: string[]; // Array of vaccine names

  @Column({ type: 'text', nullable: true })
  immunizationNotes: string;

  // Developmental Assessment
  @Column({ type: 'text', nullable: true })
  developmentalMilestones: string;

  @Column({ type: 'text', nullable: true })
  developmentalConcerns: string;

  // Screening Tests
  @Column({ type: 'boolean', default: false })
  hearingScreened: boolean;

  @Column({ type: 'text', nullable: true })
  hearingScreeningResults: string;

  @Column({ type: 'boolean', default: false })
  metabolicScreened: boolean;

  @Column({ type: 'text', nullable: true })
  metabolicScreeningResults: string;

  @Column({ type: 'boolean', default: false })
  birthDefectsScreened: boolean;

  @Column({ type: 'text', nullable: true })
  birthDefectsScreeningResults: string;

  // Counseling Provided
  @Column({ type: 'simple-array', nullable: true })
  counselingTopics: string[]; // Array of topics covered

  @Column({ type: 'text', nullable: true })
  counselingNotes: string;

  // Risk Assessment
  @Column({ type: 'boolean', default: false })
  riskFlagRaised: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  riskLevel: string; // 'Low', 'Medium', 'High', 'Critical'

  @Column({ type: 'text', nullable: true })
  riskAssessment: string;

  @Column({ type: 'text', nullable: true })
  riskManagementPlan: string;

  // Referral Information
  @Column({ type: 'boolean', default: false })
  referralRequired: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referralFacility: string;

  @Column({ type: 'text', nullable: true })
  referralReason: string;

  // Follow-up Planning
  @Column({ type: 'timestamp', nullable: true })
  nextVisitDate: Date;

  @Column({ type: 'text', nullable: true })
  followUpPlan: string;

  // Clinician Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  clinicianName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  clinicianPhone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  healthFacility: string;

  // General Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
