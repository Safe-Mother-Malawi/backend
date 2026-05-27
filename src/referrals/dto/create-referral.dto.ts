import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { ReferralReason, TransportMode } from '../entities/referral.entity';

export class CreateReferralDto {
  @IsOptional()
  @IsUUID()
  prenatalPatientId?: string;

  @IsOptional()
  @IsUUID()
  neonatalPatientId?: string;

  @IsString()
  patientName: string;

  @IsString()
  patientContact: string;

  @IsOptional()
  @IsString()
  patientAge?: string;

  @IsEnum(ReferralReason)
  reason: ReferralReason;

  @IsString()
  clinicalSummary: string;

  @IsOptional()
  @IsString()
  urgencyNotes?: string;

  @IsUUID()
  referringFacilityId: string;

  @IsUUID()
  receivingFacilityId: string;

  @IsEnum(TransportMode)
  transportMode: TransportMode;

  @IsOptional()
  @IsString()
  transportProvider?: string;

  @IsOptional()
  @IsString()
  transportContact?: string;

  @IsOptional()
  @IsString()
  transportNotes?: string;
}
