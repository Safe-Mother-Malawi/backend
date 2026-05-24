import { IsString, IsOptional, IsDate, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateNeonatalPatientDto {
  @IsString()
  prenatalPatientId: string;

  @IsString()
  babyName: string;

  @IsString()
  babyGender: string; // 'Male', 'Female'

  @IsDate()
  dateOfBirth: Date;

  @IsOptional()
  @IsNumber()
  birthWeight?: number;

  @IsOptional()
  @IsNumber()
  birthLength?: number;

  @IsOptional()
  @IsNumber()
  headCircumference?: number;

  @IsOptional()
  @IsString()
  deliveryMode?: string;

  @IsOptional()
  @IsString()
  deliveryPlace?: string;

  @IsOptional()
  @IsString()
  deliveryComplications?: string;

  @IsOptional()
  @IsString()
  apgarScore1Min?: string;

  @IsOptional()
  @IsString()
  apgarScore5Min?: string;

  @IsOptional()
  @IsBoolean()
  birthDefectsScreened?: boolean;

  @IsOptional()
  @IsString()
  birthDefectsFindings?: string;

  @IsOptional()
  @IsBoolean()
  hearingScreened?: boolean;

  @IsOptional()
  @IsString()
  hearingScreeningResults?: string;

  @IsOptional()
  @IsBoolean()
  metabolicScreened?: boolean;

  @IsOptional()
  @IsString()
  metabolicScreeningResults?: string;

  @IsOptional()
  @IsString()
  feedingType?: string;

  @IsOptional()
  @IsBoolean()
  breastfeedingInitiated?: boolean;

  @IsOptional()
  @IsDate()
  breastfeedingInitiatedTime?: Date;

  @IsOptional()
  @IsString()
  feedingChallenges?: string;

  @IsOptional()
  @IsArray()
  immunizationsGiven?: string[];

  @IsOptional()
  @IsString()
  currentHealthStatus?: string;

  @IsOptional()
  @IsString()
  healthConcerns?: string;

  @IsOptional()
  @IsBoolean()
  jaundicePresent?: boolean;

  @IsOptional()
  @IsString()
  jaundiceLevel?: string;

  @IsOptional()
  @IsBoolean()
  umbilicalCordInfection?: boolean;

  @IsOptional()
  @IsBoolean()
  skinInfection?: boolean;

  @IsOptional()
  @IsString()
  otherHealthIssues?: string;

  @IsOptional()
  @IsBoolean()
  riskFlagRaised?: boolean;

  @IsOptional()
  @IsString()
  riskAssessment?: string;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsString()
  clinicianName?: string;

  @IsOptional()
  @IsString()
  clinicianPhone?: string;

  @IsOptional()
  @IsString()
  healthFacility?: string;
}
