import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum IvrCallStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
  ABANDONED   = 'abandoned',
}

export enum IvrCallOutcome {
  RISK_COMPLETED  = 'risk_completed',
  APPOINTMENT     = 'appointment',
  TIPS            = 'tips',
  EMERGENCY       = 'emergency',
  ABANDONED_EARLY = 'abandoned_early',
  TIMEOUT         = 'timeout',
}

export enum IvrMenuAction {
  CALL_START       = 'call_start',
  CALL_END         = 'call_end',
  MAIN_MENU        = 'main_menu',
  SYMPTOM_ANSWER   = 'symptom_answer',
  RISK_RESULT      = 'risk_result',
  APPOINTMENT_INFO = 'appointment_info',
  HEALTH_TIPS      = 'health_tips',
  EMERGENCY        = 'emergency',
  TIMEOUT          = 'timeout',
  INVALID_INPUT    = 'invalid_input',
}

@Entity('ivr_call_logs')
@Index(['callerPhone', 'startedAt'])
@Index(['patientId'])
@Index(['status'])
@Index(['outcome'])
export class IvrCallLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  @Index()
  sessionId: string;

  @Column({ type: 'varchar' })
  @Index()
  callerPhone: string;

  @Column({ type: 'varchar', nullable: true })
  patientId: string | null;

  @Column({ type: 'varchar', nullable: true })
  patientName: string | null;

  @Column({ type: 'varchar', nullable: true })
  patientType: 'prenatal' | 'neonatal' | null;

  @Column({ type: 'varchar', nullable: true })
  district: string | null;

  @Column({ type: 'varchar', nullable: true })
  healthCentre: string | null;

  @Column({ type: 'enum', enum: IvrCallStatus, default: IvrCallStatus.IN_PROGRESS })
  status: IvrCallStatus;

  @Column({ type: 'enum', enum: IvrCallOutcome, nullable: true })
  outcome: IvrCallOutcome | null;

  @CreateDateColumn()
  @Index()
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number | null;

  // Every menu visited + digit pressed, in order
  @Column({ type: 'jsonb', default: [] })
  interactions: IvrInteraction[];

  // Populated when a risk assessment is completed via IVR
  @Column({ type: 'int', nullable: true })
  riskScore: number | null;

  @Column({ type: 'varchar', nullable: true })
  riskLevel: string | null;

  @Column({ type: 'varchar', nullable: true })
  carePathway: string | null;

  @Column({ type: 'jsonb', nullable: true })
  symptomAnswers: Record<string, number> | null;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface IvrInteraction {
  timestamp: string;          // ISO 8601
  action: IvrMenuAction;
  menuKey?: string;           // current menu state
  questionText?: string;      // the question that was asked
  digitPressed?: string;      // caller's DTMF input
  answerLabel?: string;       // human-readable answer
  answerScore?: number;       // numeric score assigned
  riskScore?: number;         // final risk score (risk_result action only)
  riskCategory?: string;      // risk category string
  carePathway?: string;       // care pathway string
  isTimeout?: boolean;
}
