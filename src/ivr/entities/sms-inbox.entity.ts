import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SmsProcessingStatus {
  RECEIVED  = 'received',
  PROCESSED = 'processed',
  FAILED    = 'failed',
}

/**
 * Stores every inbound SMS received from Africa's Talking.
 * Used for audit, analytics, and re-processing failed messages.
 */
@Entity('sms_inbox')
@Index(['from', 'receivedAt'])
@Index(['status'])
@Index(['keyword'])
export class SmsInboxMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Africa's Talking message ID — used as lastReceivedId for pagination */
  @Column({ type: 'bigint' })
  @Index({ unique: true })
  atMessageId: number;

  /** Sender phone number (E.164) */
  @Column({ type: 'varchar' })
  @Index()
  from: string;

  /** Recipient — your AT virtual number or shortcode */
  @Column({ type: 'varchar' })
  to: string;

  /** Raw SMS text */
  @Column({ type: 'text' })
  text: string;

  /** Parsed keyword command (help, appointment, tips, etc.) */
  @Column({ type: 'varchar', nullable: true })
  keyword: string | null;

  /** Reply sent back to the patient */
  @Column({ type: 'text', nullable: true })
  reply: string | null;

  @Column({ type: 'enum', enum: SmsProcessingStatus, default: SmsProcessingStatus.RECEIVED })
  status: SmsProcessingStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'timestamptz' })
  receivedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
