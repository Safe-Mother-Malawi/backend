import { IsOptional, IsString, IsEmail, IsInt, Min, Max } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  facilityName?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  // Prenatal-specific fields
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

  @IsOptional()
  @IsInt()
  @Min(0)
  gravida?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  parity?: number;

  // Neonatal-specific fields
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
}
