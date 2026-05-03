import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid phone number.' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;

  @IsEnum(UserRole, { message: 'Role must be prenatal, neonatal, clinician, dho, or admin.' })
  role: UserRole;

  // ── Profile ───────────────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  facilityName?: string;

  // ── Prenatal ──────────────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  pregnancyMonths?: string;

  @IsOptional()
  @IsString()
  pregnancyWeeks?: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  lmpDate?: string;

  // ── Neonatal ──────────────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  babyName?: string;

  @IsOptional()
  @IsString()
  babyDob?: string;

  @IsOptional()
  @IsString()
  babyGender?: string;

  @IsOptional()
  @IsString()
  babyBirthWeight?: string;

  // ── Security question ─────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  securityQuestion?: string;

  @IsOptional()
  @IsString()
  securityAnswer?: string;
}
