import { IsString, IsOptional, IsDate, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateNeonatalVisitDto {
  @IsString()
  neonatalPatientId: string;

  @IsNumber()
  visitNumber: number;

  @IsDate()
  scheduledDate: Date;

  @IsOptional()
  @IsDate()
  completedDate?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  headCircumference?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @IsOptional()
  @IsString()
  generalAppearance?: string;

  @IsOptional()
  @IsString()
  skinExamination?: string;

  @IsOptional()
  @IsString()
  umbilicalCordStatus?: string;

  @IsOptional()
  @IsString()
  eyeExamination?: string;

  @IsOptional()
  @IsString()
  earExamination?: string;

  @IsOptional()
  @IsString()
  mouthExamination?: string;

  @IsOptional()
  @IsString()
  chestExamination?: string;

  @IsOptional()
  @IsString()
  abdominalExamination?: string;

  @IsOptional()
  @IsString()
  genitalsExamination?: string;

  @IsOptional()
  @IsString()
  extremitiesExamination?: string;

  @IsOptional()
  @IsString()
  neurologicalExamination?: string;

  @IsOptional()
  @IsBoolean()
  jaundicePresent?: boolean;

  @IsOptional()
  @IsString()
  jaundiceLevel?: string;

  @IsOptional()
  @IsNumber()
  bilirubinLevel?: number;

  @IsOptional()
  @IsString()
  feedingType?: string;

  @IsOptional()
  @IsBoolean()
  feedingWellEstablished?: boolean;

  @IsOptional()
  @IsString()
  feedingChallenges?: string;

  @IsOptional()
  @IsString()
  feedingRecommendations?: string;

  @IsOptional()
  @IsArray()
  immunizationsGiven?: string[];

  @IsOptional()
  @IsString()
  immunizationNotes?: string;

  @IsOptional()
  @IsString()
  developmentalMilestones?: string;

  @IsOptional()
  @IsString()
  developmentalConcerns?: string;

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
  @IsBoolean()
  birthDefectsScreened?: boolean;

  @IsOptional()
  @IsString()
  birthDefectsScreeningResults?: string;

  @IsOptional()
  @IsArray()
  counselingTopics?: string[];

  @IsOptional()
  @IsString()
  counselingNotes?: string;

  @IsOptional()
  @IsBoolean()
  riskFlagRaised?: boolean;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsString()
  riskAssessment?: string;

  @IsOptional()
  @IsString()
  riskManagementPlan?: string;

  @IsOptional()
  @IsBoolean()
  referralRequired?: boolean;

  @IsOptional()
  @IsString()
  referralFacility?: string;

  @IsOptional()
  @IsString()
  referralReason?: string;

  @IsOptional()
  @IsDate()
  nextVisitDate?: Date;

  @IsOptional()
  @IsString()
  followUpPlan?: string;

  @IsOptional()
  @IsString()
  clinicianName?: string;

  @IsOptional()
  @IsString()
  clinicianPhone?: string;

  @IsOptional()
  @IsString()
  healthFacility?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
