import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Options,
} from '@nestjs/common';
import { IsOptional, IsString, IsEmail } from 'class-validator';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GetSecurityQuestionDto, ResetPasswordDto, RequestPasswordResetDto, ResetPasswordWithTokenDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

class UpdateMeDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() facilityName?: string;
}

@SkipThrottle()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── CORS preflight handling ──────────────────────────────────────────────

  @Options('*')
  @HttpCode(HttpStatus.OK)
  handleOptions() {
    return {};
  }

  /** POST /auth/register */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** POST /auth/login — rate limited: 10 attempts per minute */
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** POST /auth/refresh */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    return this.authService.refresh(payload.sub, dto.refreshToken);
  }

  /** POST /auth/logout */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }

  /** GET /auth/me */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user);
  }

  /**
   * PATCH /auth/me
   * Any authenticated user can update their own safe profile fields.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.id, dto);
  }

  /** POST /auth/forgot-password/question */
  @Post('forgot-password/question')
  @HttpCode(HttpStatus.OK)
  async getSecurityQuestion(@Body() dto: GetSecurityQuestionDto) {
    const question = await this.authService.getSecurityQuestion(dto.identifier);
    return { question };
  }

  /** POST /auth/forgot-password/reset */
  @Post('forgot-password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword({
      identifier: dto.identifier,
      securityAnswer: dto.securityAnswer,
      newPassword: dto.newPassword,
    });
    return { message: 'Password reset successfully.' };
  }

  /** POST /auth/forgot-password/request-reset (Email-based flow) */
  @Post('forgot-password/request-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    try {
      // Neutral response regardless of whether email exists
      await this.authService.requestPasswordReset(dto.email);
      return {
        message: 'If an account exists with this email, we have sent reset instructions.',
      };
    } catch (error) {
      // Check for specific email service errors
      if (error.message.includes('535-5.7.8') || error.message.includes('Username and Password not accepted')) {
        return {
          error: 'Email service authentication failed. Please use the security question option or contact support.',
          useSecurityQuestion: true,
        };
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return {
          error: 'Email service is temporarily unavailable. Please try the security question option.',
          useSecurityQuestion: true,
        };
      } else {
        return {
          error: 'Failed to send reset email. Please use the security question option or try again later.',
          useSecurityQuestion: true,
        };
      }
    }
  }

  /** POST /auth/forgot-password/reset-with-token (Email-based flow) */
  @Post('forgot-password/reset-with-token')
  @HttpCode(HttpStatus.OK)
  async resetPasswordWithToken(@Body() dto: ResetPasswordWithTokenDto) {
    await this.authService.resetPasswordWithToken({
      token: dto.token,
      newPassword: dto.newPassword,
      confirmPassword: dto.confirmPassword,
    });
    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  /** GET /auth/forgot-password/verify-token/:token (Verify reset token) */
  @Get('forgot-password/verify-token/:token')
  @HttpCode(HttpStatus.OK)
  async verifyResetToken(@Param('token') token: string) {
    const isValid = await this.authService.verifyResetToken(token);
    return { valid: isValid };
  }

  /** GET /auth/email/health (Check email service health) */
  @Get('email/health')
  @HttpCode(HttpStatus.OK)
  async checkEmailHealth() {
    try {
      // This will test the email configuration
      const testResult = await this.authService.testEmailService();
      return { 
        healthy: testResult, 
        service: 'Gmail SMTP',
        message: testResult ? 'Email service is operational' : 'Email service is not configured or failing'
      };
    } catch (error) {
      return { 
        healthy: false, 
        service: 'Gmail SMTP',
        error: error.message,
        message: 'Email service health check failed'
      };
    }
  }

  /** POST /auth/change-password */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
    return { message: 'Password changed successfully' };
  }
}
