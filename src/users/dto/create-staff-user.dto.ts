import {
  IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

// ── Admin creates: admin or dho ───────────────────────────────────────────────
export class CreateDhoDto {
  @IsNotEmpty() @IsString() fullName: string;

  @IsEmail({}, { message: 'Enter a valid email.' })
  email: string;

  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid phone number.' })
  phone: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;

  @IsEnum([UserRole.ADMIN, UserRole.DHO], {
    message: 'Admin can only create admin or dho accounts.',
  })
  role: UserRole;

  @IsNotEmpty() @IsString() region: string;
  @IsNotEmpty() @IsString() zone: string;
  @IsNotEmpty() @IsString() district: string;
  @IsOptional() @IsString() facility?: string;
}

// ── DHO creates: clinician only ───────────────────────────────────────────────
export class CreateClinicianDto {
  @IsNotEmpty() @IsString() fullName: string;

  @IsEmail({}, { message: 'Enter a valid email.' })
  email: string;

  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid phone number.' })
  phone: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;

  // Accept but ignore role — server always forces clinician regardless
  @IsOptional() @IsString() role?: string;

  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() facility?: string;
}

// ── Shared update DTO ─────────────────────────────────────────────────────────
export class UpdateStaffUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() facility?: string;

  @IsOptional()
  @IsEnum([UserRole.ADMIN, UserRole.DHO, UserRole.CLINICIAN])
  role?: UserRole;
}

// ── Mobile user update DTO ────────────────────────────────────────────────────
export class UpdateMobileUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() age?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() facilityName?: string;

  // Prenatal fields
  @IsOptional() @IsString() pregnancyMonths?: string;
  @IsOptional() @IsString() pregnancyWeeks?: string;
  @IsOptional() @IsString() expectedDeliveryDate?: string;
  @IsOptional() @IsString() lmpDate?: string;

  // Neonatal fields
  @IsOptional() @IsString() babyName?: string;
  @IsOptional() @IsString() babyDob?: string;
  @IsOptional() @IsString() babyGender?: string;
  @IsOptional() @IsString() babyBirthWeight?: string;
}
