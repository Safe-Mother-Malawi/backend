import { IsOptional, IsString, IsDate, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum NeonatalPatientStatus {
  ALIVE = 'alive',
  DECEASED = 'deceased',
  TRANSFERRED = 'transferred',
}

export enum NeonatalHealthStatus {
  HEALTHY = 'healthy',
  AT_RISK = 'at-risk',
  CRITICAL = 'critical',
}

export class UpdateNeonatalPatientDto {
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

  @IsOptional()
  @IsString()
  birthLength?: string;

  @IsOptional()
  @IsString()
  headCircumference?: string;

  @IsOptional()
  @IsString()
  apgarScore?: string;

  @IsOptional()
  @IsString()
  gestationalAgeAtBirth?: string;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @IsOptional()
  @IsString()
  birthAttendant?: string;

  @IsOptional()
  @IsString()
  complicationsDuringDelivery?: string;

  // Neonatal Health Tracking
  @IsOptional()
  @IsEnum(NeonatalPatientStatus)
  patientStatus?: NeonatalPatientStatus;

  @IsOptional()
  @IsString()
  causeOfDeath?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfDeath?: Date;

  @IsOptional()
  @IsString()
  deathNotes?: string;

  // Vaccination Tracking
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vaccinesGiven?: string[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastVaccinationDate?: Date;

  // Health Complications
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  healthComplications?: string[];

  @IsOptional()
  @IsEnum(NeonatalHealthStatus)
  currentHealthStatus?: NeonatalHealthStatus;

  // Follow-up Tracking
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextFollowUpDate?: Date;

  @IsOptional()
  @IsBoolean()
  followUpCompleted?: boolean;

  @IsOptional()
  @IsString()
  followUpNotes?: string;
}
