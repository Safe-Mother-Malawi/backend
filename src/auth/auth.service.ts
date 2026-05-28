import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PatientsService } from '../patients/patients.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { PasswordResetEmailService } from './services/password-reset-email.service';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Partial<User>;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly patientsService: PatientsService,
    private readonly activityLog: ActivityLogService,
    private readonly notificationsService: NotificationsService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private readonly passwordResetEmailService: PasswordResetEmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Register ──────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create({
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      role: dto.role,
      fullName: dto.fullName,
      age: dto.age,
      nationality: dto.nationality,
      district: dto.district,
      facilityName: dto.facilityName,
      pregnancyMonths: dto.pregnancyMonths,
      pregnancyWeeks: dto.pregnancyWeeks,
      expectedDeliveryDate: dto.expectedDeliveryDate,
      lmpDate: dto.lmpDate,
      village: dto.village,
      gravida: dto.gravida,
      parity: dto.parity,
      existingConditions: dto.existingConditions,
      emergencyContact: dto.emergencyContact,
      babyName: dto.babyName,
      babyDob: dto.babyDob,
      babyGender: dto.babyGender,
      babyBirthWeight: dto.babyBirthWeight,
      securityQuestion: dto.securityQuestion,
      securityAnswer: dto.securityAnswer,
    });

    // Auto-link to any existing clinician-registered patient record.
    // If no existing record is found, create a new patient record automatically
    // so the patient appears in the clinician dashboard and patient lists.
    if (user.role === UserRole.PRENATAL || user.role === UserRole.NEONATAL) {
      await this.patientsService.linkOrCreatePatientRecord(user);
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);

    // Log activity synchronously (fast)
    await this.activityLog.log({
      action: ActivityAction.USER_REGISTERED,
      actorId: user.id,
      description: `New ${user.role} account registered: ${user.fullName} (${user.phone})`,
      resourceType: 'user',
      resourceId: user.id,
      meta: { role: user.role, district: user.district },
    });

    // Fire-and-forget: Send notifications asynchronously without blocking registration response
    setImmediate(() => {
      // Notify clinicians when a patient registers (so they can follow up)
      if (user.role === UserRole.PRENATAL || user.role === UserRole.NEONATAL) {
        this.notificationsService.notifyClinicians(
          `New ${user.role === UserRole.PRENATAL ? 'Prenatal' : 'Neonatal'} Patient Registered`,
          `${user.fullName} has registered via the mobile app in ${user.district ?? 'unknown district'}.`,
          NotificationType.INFO,
        ).catch((err) => console.error('Failed to notify clinicians:', err));
      }

      // Notify admins when any new staff account is created
      if (user.role === UserRole.CLINICIAN || user.role === UserRole.DHO) {
        this.notificationsService.notifyAdmins(
          'New Staff Account Created',
          `A new ${user.role} account was created for ${user.fullName}.`,
          NotificationType.INFO,
        ).catch((err) => console.error('Failed to notify admins:', err));
      }
    });

    return { user: this.sanitize(user), tokens };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailOrPhone(dto.identifier.trim());
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const valid = await this.usersService.validatePassword(user, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials.');

    const tokens = await this.generateTokens(user);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);

    // Log activity synchronously (fast)
    await this.activityLog.log({
      action: ActivityAction.USER_LOGIN,
      actorId: user.id,
      description: `${user.role} logged in: ${user.fullName}`,
      resourceType: 'user',
      resourceId: user.id,
    });

    // Fire-and-forget: Don't await notifications, send them asynchronously
    // This prevents blocking the login response
    setImmediate(() => {
      this.activityLog.log({
        action: ActivityAction.USER_LOGIN,
        actorId: user.id,
        description: `${user.role} logged in: ${user.fullName}`,
        resourceType: 'user',
        resourceId: user.id,
      }).catch((err) => console.error('Failed to log login activity:', err));
    });

    return { user: this.sanitize(user), tokens };
  }

  // ── Refresh tokens ────────────────────────────────────────────────────────

  async refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    const valid = await this.usersService.validateRefreshToken(userId, refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid or expired refresh token.');

    const user = await this.usersService.findByIdOrThrow(userId);
    const tokens = await this.generateTokens(user);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshToken(userId, null);
    await this.activityLog.log({
      action: ActivityAction.USER_LOGOUT,
      actorId: userId,
      description: 'User logged out',
      resourceType: 'user',
      resourceId: userId,
    });
  }

  // ── Forgot password ───────────────────────────────────────────────────────

  async getSecurityQuestion(identifier: string): Promise<string> {
    const question = await this.usersService.getSecurityQuestion(identifier.trim());
    if (!question) {
      throw new BadRequestException('No account found for that phone number or email.');
    }
    return question;
  }

  async resetPassword(data: {
    identifier: string;
    securityAnswer: string;
    newPassword: string;
  }): Promise<void> {
    // Validate password length: 6-10 characters
    if (data.newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }
    if (data.newPassword.length > 10) {
      throw new BadRequestException('Password must be a maximum of 10 characters.');
    }

    // Validate password requirements
    if (!/[A-Z]/.test(data.newPassword)) {
      throw new BadRequestException('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(data.newPassword)) {
      throw new BadRequestException('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(data.newPassword)) {
      throw new BadRequestException('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(data.newPassword)) {
      throw new BadRequestException('Password must contain at least one special character.');
    }

    // Check for common passwords
    const commonPasswords = [
      'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', 'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou',
      'master', 'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow',
      '123123', '654321', 'superman', 'qazwsx', 'michael', 'football',
    ];
    if (commonPasswords.includes(data.newPassword.toLowerCase())) {
      throw new BadRequestException('This password is too common. Please choose a different password.');
    }

    const ok = await this.usersService.resetPassword(data);
    if (!ok) {
      throw new BadRequestException('Security answer is incorrect.');
    }

    // Fire-and-forget: Notify admins asynchronously without blocking password reset response
    setImmediate(() => {
      this.usersService.findByEmailOrPhone(data.identifier)
        .then((user) => {
          if (user) {
            return this.notificationsService.notifyAdmins(
              'Password Reset Alert',
              `User ${user.fullName} (${user.role}) has reset their password via security question.`,
              NotificationType.ALERT,
            );
          }
        })
        .catch((error) => console.error('Failed to notify admins of password reset:', error));
    });
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  getProfile(user: User): Partial<User> {
    return this.sanitize(user);
  }

  async updateMe(userId: string, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    district?: string;
    facilityName?: string;
  }): Promise<Partial<User>> {
    await this.usersService.updateUser(userId, {
      fullName:     data.fullName,
      email:        data.email,
      phone:        data.phone,
      district:     data.district,
      facility:     data.facilityName,
    });
    // Re-fetch so the response reflects the saved state
    const updated = await this.usersService.findByIdOrThrow(userId);
    return this.sanitize(updated);
  }

  // ── Change Password ───────────────────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByIdOrThrow(userId);
    const isValid = await this.usersService.validatePassword(user, currentPassword);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    // Validate new password requirements
    if (newPassword.length < 6 || newPassword.length > 10) {
      throw new BadRequestException('Password must be 6-10 characters.');
    }
    if (!/[A-Z]/.test(newPassword)) {
      throw new BadRequestException('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(newPassword)) {
      throw new BadRequestException('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(newPassword)) {
      throw new BadRequestException('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      throw new BadRequestException('Password must contain at least one special character.');
    }

    // Check for common passwords
    const commonPasswords = [
      'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', 'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou',
      'master', 'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow',
      '123123', '654321', 'superman', 'qazwsx', 'michael', 'football',
    ];
    if (commonPasswords.includes(newPassword.toLowerCase())) {
      throw new BadRequestException('This password is too common. Please choose a different password.');
    }

    await this.usersService.updatePassword(userId, newPassword);

    // Fire-and-forget: Notify admins asynchronously without blocking password change response
    setImmediate(() => {
      this.usersService.findByIdOrThrow(userId)
        .then((user) => {
          return this.notificationsService.notifyAdmins(
            'Password Changed',
            `User ${user.fullName} (${user.role}) has changed their password.`,
            NotificationType.INFO,
          );
        })
        .catch((error) => console.error('Failed to notify admins of password change:', error));
    });
  }

  // ── Email-based Password Reset ────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    // Find user by email (neutral response if not found)
    const user = await this.usersService.findByEmailOrPhone(email);
    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    // Generate secure reset token
    const resetToken = await this.passwordResetTokenService.generateToken(user.id);

    // Send email with reset link
    try {
      await this.passwordResetEmailService.sendResetEmail(email, resetToken, user.fullName);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Propagate the error so the mobile app knows the email failed
      throw new BadRequestException('Failed to send reset email. Please check your email address and try again later.');
    }
  }

  async verifyResetToken(token: string): Promise<boolean> {
    try {
      await this.passwordResetTokenService.verifyToken(token);
      return true;
    } catch {
      return false;
    }
  }

  async resetPasswordWithToken(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    // Validate password requirements
    if (data.newPassword.length < 6 || data.newPassword.length > 10) {
      throw new BadRequestException('Password must be 6-10 characters.');
    }
    if (!/[A-Z]/.test(data.newPassword)) {
      throw new BadRequestException('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(data.newPassword)) {
      throw new BadRequestException('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(data.newPassword)) {
      throw new BadRequestException('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(data.newPassword)) {
      throw new BadRequestException('Password must contain at least one special character.');
    }

    // Check for common passwords
    const commonPasswords = [
      'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', 'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou',
      'master', 'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow',
      '123123', '654321', 'superman', 'qazwsx', 'michael', 'football',
    ];
    if (commonPasswords.includes(data.newPassword.toLowerCase())) {
      throw new BadRequestException('This password is too common. Please choose a different password.');
    }

    // Verify token and get user
    const { userId } = await this.passwordResetTokenService.verifyToken(data.token);

    // Update password
    await this.usersService.updatePassword(userId, data.newPassword);

    // Mark token as used
    await this.passwordResetTokenService.markTokenAsUsed(data.token);

    // Invalidate all active sessions for this user
    await this.usersService.invalidateAllSessions(userId);

    // Fire-and-forget: Send password changed notification asynchronously
    setImmediate(() => {
      this.usersService.findByIdOrThrow(userId)
        .then((user) => {
          const promises: Promise<any>[] = [];
          
          if (user.email) {
            promises.push(
              this.passwordResetEmailService.sendPasswordChangedEmail(user.email, user.fullName)
                .catch((err) => console.error('Failed to send password changed email:', err))
            );
          }

          promises.push(
            this.notificationsService.notifyAdmins(
              'Password Reset Alert',
              `User ${user.fullName} (${user.role}) has reset their password via email link.`,
              NotificationType.ALERT,
            ).catch((err) => console.error('Failed to notify admins of password reset:', err))
          );

          return Promise.all(promises);
        })
        .catch((error) => console.error('Failed to send password changed notifications:', error));
    });
  }

  // ── Email Service Health Check ────────────────────────────────────────────

  async testEmailService(): Promise<boolean> {
    try {
      return await this.passwordResetEmailService.testEmailConfiguration();
    } catch (error) {
      console.error('Email service test failed:', error);
      return false;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, role: user.role };

    const accessOpts = {
      secret: this.configService.get('JWT_ACCESS_SECRET', 'access_secret'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    } as Parameters<typeof this.jwtService.signAsync>[1];

    const refreshOpts = {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'refresh_secret'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    } as Parameters<typeof this.jwtService.signAsync>[1];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as object, accessOpts),
      this.jwtService.signAsync(payload as object, refreshOpts),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitize(user: User): Partial<User> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, securityAnswerHash, ...safe } = user;
    return safe;
  }
}
