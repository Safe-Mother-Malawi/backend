import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  PRENATAL = 'prenatal',
  NEONATAL = 'neonatal',
  CLINICIAN = 'clinician',
  DHO = 'dho',
  ADMIN = 'admin',
}

export const MOBILE_ROLES = [UserRole.PRENATAL, UserRole.NEONATAL];
export const STAFF_ROLES  = [UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Identity ──────────────────────────────────────────────────────────────

  @Column({ type: 'varchar', nullable: true, unique: true })
  @Index()
  email: string | null;

  @Column({ type: 'varchar', unique: true })
  @Index()
  phone: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  // ── Profile ───────────────────────────────────────────────────────────────

  @Column({ type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  age: string | null;

  @Column({ type: 'varchar', nullable: true })
  nationality: string | null;

  @Column({ type: 'varchar', nullable: true })
  region: string | null;

  @Column({ type: 'varchar', nullable: true })
  zone: string | null;

  @Column({ type: 'varchar', nullable: true })
  district: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'healthCentre' })
  facilityName: string | null;

  // ── Prenatal fields ───────────────────────────────────────────────────────

  @Column({ type: 'varchar', nullable: true })
  pregnancyMonths: string | null;

  @Column({ type: 'varchar', nullable: true })
  pregnancyWeeks: string | null;

  @Column({ type: 'varchar', nullable: true })
  expectedDeliveryDate: string | null;

  @Column({ type: 'varchar', nullable: true })
  lmpDate: string | null;

  // ── Neonatal fields ───────────────────────────────────────────────────────

  @Column({ type: 'varchar', nullable: true })
  babyName: string | null;

  @Column({ type: 'varchar', nullable: true })
  babyDob: string | null;

  @Column({ type: 'varchar', nullable: true })
  babyGender: string | null;

  @Column({ type: 'varchar', nullable: true })
  babyBirthWeight: string | null;

  // ── Security / Password recovery ─────────────────────────────────────────

  @Column({ type: 'varchar', nullable: true })
  securityQuestion: string | null;

  @Column({ type: 'varchar', nullable: true })
  securityAnswerHash: string | null;

  // ── Refresh token ─────────────────────────────────────────────────────────

  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  facility: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastActiveAt: Date | null;

  // ── User Preferences ──────────────────────────────────────────────────────

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  preferences: {
    appointmentReminders?: boolean;
    dailyTips?: boolean;
    babyMilestones?: boolean;
    healthAlerts?: boolean;
    darkMode?: boolean;
    offlineMode?: boolean;
    appLanguage?: string;
  } | null;

  // ── Timestamps ────────────────────────────────────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
