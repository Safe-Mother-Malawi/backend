import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_HOURS = 1;

@Injectable()
export class PasswordResetTokenService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepo: Repository<PasswordResetToken>,
  ) {}

  /**
   * Generate a secure, single-use reset token
   */
  async generateToken(userId: string): Promise<string> {
    // Invalidate any existing tokens for this user
    await this.tokenRepo.update(
      { userId, used: false },
      { used: true, usedAt: new Date() },
    );

    // Generate random token (32 bytes = 256 bits)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, SALT_ROUNDS);

    // Calculate expiry time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Store token
    const token = this.tokenRepo.create({
      userId,
      token: rawToken,
      tokenHash,
      expiresAt,
      used: false,
    });

    await this.tokenRepo.save(token);

    return rawToken;
  }

  /**
   * Verify and validate a reset token
   */
  async verifyToken(token: string): Promise<{ userId: string; valid: boolean }> {
    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    // Find token by raw value
    const resetToken = await this.tokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if already used
    if (resetToken.used) {
      throw new BadRequestException('This reset token has already been used');
    }

    // Check if expired
    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Reset token has expired. Please request a new one');
    }

    return { userId: resetToken.userId, valid: true };
  }

  /**
   * Mark token as used
   */
  async markTokenAsUsed(token: string): Promise<void> {
    await this.tokenRepo.update(
      { token },
      { used: true, usedAt: new Date() },
    );
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.tokenRepo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
    return result.affected || 0;
  }

  /**
   * Invalidate all tokens for a user
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    await this.tokenRepo.update(
      { userId, used: false },
      { used: true, usedAt: new Date() },
    );
  }
}
