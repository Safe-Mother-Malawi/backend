import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { HealthFacility } from '../../health-facilities/entities/health-facility.entity';
import { PrenatalPatient } from '../../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../../patients/entities/neonatal-patient.entity';

export enum ReferralReason {
  HYPERTENSION = 'hypertension',
  BLEEDING = 'bleeding',
  INFECTION = 'infection',
  FETAL_DISTRESS = 'fetal_distress',
  PREMATURE_LABOR = 'premature_labor',
  PLACENTAL_ISSUES = 'placental_issues',
  NEONATAL_EMERGENCY = 'neonatal_emergency',
  NEONATAL_INFECTION = 'neonatal_infection',
  LOW_BIRTH_WEIGHT = 'low_birth_weight',
  RESPIRATORY_DISTRESS = 'respiratory_distress',
  JAUNDICE = 'jaundice',
  OTHER = 'other',
}

export enum ReferralStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum TransportMode {
  AMBULANCE = 'ambulance',
  PERSONAL_VEHICLE = 'personal_vehicle',
  MOTORCYCLE = 'motorcycle',
  WALKING = 'walking',
  OTHER = 'other',
}

@Entity('referrals')
@Index(['referringFacilityId', 'status'])
@Index(['receivingFacilityId', 'status'])
@Index(['prenatalPatientId', 'status'])
@Index(['neonatalPatientId', 'status'])
@Index(['createdAt', 'status'])
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Patient information
  @Column({ type: 'varchar', nullable: true })
  prenatalPatientId: string | null;

  @ManyToOne(() => PrenatalPatient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'prenatalPatientId' })
  prenatalPatient: PrenatalPatient | null;

  @Column({ type: 'varchar', nullable: true })
  neonatalPatientId: string | null;

  @ManyToOne(() => NeonatalPatient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'neonatalPatientId' })
  neonatalPatient: NeonatalPatient | null;

  @Column({ type: 'varchar' })
  patientName: string;

  @Column({ type: 'varchar' })
  patientContact: string;

  @Column({ type: 'varchar', nullable: true })
  patientAge: string | null;

  // Referral details
  @Column({ type: 'enum', enum: ReferralReason })
  reason: ReferralReason;

  @Column({ type: 'text' })
  clinicalSummary: string;

  @Column({ type: 'text', nullable: true })
  urgencyNotes: string | null;

  @Column({ type: 'enum', enum: ReferralStatus, default: ReferralStatus.PENDING })
  status: ReferralStatus;

  // Facility information
  @Column({ type: 'varchar' })
  referringFacilityId: string;

  @ManyToOne(() => HealthFacility, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'referringFacilityId' })
  referringFacility: HealthFacility | null;

  @Column({ type: 'varchar' })
  receivingFacilityId: string;

  @ManyToOne(() => HealthFacility, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receivingFacilityId' })
  receivingFacility: HealthFacility | null;

  // Clinician information
  @Column({ type: 'varchar' })
  referringClinicianId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'referringClinicianId' })
  referringClinician: User | null;

  @Column({ type: 'varchar', nullable: true })
  receivingClinicianId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receivingClinicianId' })
  receivingClinician: User | null;

  // Transport information
  @Column({ type: 'enum', enum: TransportMode, default: TransportMode.AMBULANCE })
  transportMode: TransportMode;

  @Column({ type: 'varchar', nullable: true })
  transportProvider: string | null;

  @Column({ type: 'varchar', nullable: true })
  transportContact: string | null;

  @Column({ type: 'timestamp', nullable: true })
  departureTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  arrivalTime: Date | null;

  @Column({ type: 'text', nullable: true })
  transportNotes: string | null;

  // Acceptance/Rejection
  @Column({ type: 'boolean', default: false })
  acceptedByReceivingFacility: boolean;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  // Outcome
  @Column({ type: 'text', nullable: true })
  treatmentOutcome: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  referralCode: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
