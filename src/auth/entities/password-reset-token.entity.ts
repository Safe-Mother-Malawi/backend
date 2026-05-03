import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Password reset token entity
 * Stores secure, single-use tokens for password reset
 */
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  token: string; // Hashed token

  @Column()
  tokenHash: string; // Double-hashed for extra security

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date; // Token expires after 1 hour

  @Column({ default: false })
  used: boolean; // Mark as used after password reset

  @Column({ nullable: true })
  usedAt: Date; // When the token was used
}
