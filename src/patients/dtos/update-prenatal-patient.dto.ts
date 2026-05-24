import { IsOptional, IsString, IsDate, IsBoolean, IsArray, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export enum PrenatalPatientStatus {
  ACTIVE = 'active',
  DELIVERED = 'delivered',
  LOST_TO_FOLLOWUP = 'lost-to-followup',
  TRANSFERRED = 'transferred',
}

export enum DeliveryOutcome {
  LIVE_BIRTH = 'live-birth',
  STILLBIRTH = 'stillbirth',
  MISCARRIAGE = 'miscarriage',
}

export enum DeliveryMethod {
  VAGINAL = 'vaginal',
  CESAREAN = 'cesarean',
  ASSISTED = 'assisted',
}

export enum PlaceOfDelivery {
  HEALTH_FACILITY = 'health-facility',
  HOME = 'home',
  OTHER = 'other',
}

export enum MaternalHealthStatus {
  HEALTHY = 'healthy',
  AT_RISK = 'at-risk',
  CRITICAL = 'critical',
}

export class UpdatePrenatalPatientDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

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
  village?: string;

  @IsOptional()
  @IsString()
  facilityName?: string;

  @IsOptional()
  @IsString()
  lmpDate?: string;

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
  @IsInt()
  gravida?: number;

  @IsOptional()
  @IsInt()
  parity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existingConditions?: string[];

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  // Maternal Health Tracking
  @IsOptional()
  @IsEnum(PrenatalPatientStatus)
  patientStatus?: PrenatalPatientStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deliveryDate?: Date;

  @IsOptional()
  @IsEnum(DeliveryOutcome)
  deliveryOutcome?: DeliveryOutcome;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @IsOptional()
  @IsEnum(PlaceOfDelivery)
  placeOfDelivery?: PlaceOfDelivery;

  // Maternal Complications
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  antenatalComplications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryComplications?: string[];

  @IsOptional()
  @IsEnum(MaternalHealthStatus)
  currentMaternalStatus?: MaternalHealthStatus;

  // ANC Compliance
  @IsOptional()
  @IsInt()
  ancVisitsCompleted?: number;

  @IsOptional()
  @IsInt()
  ancVisitsScheduled?: number;

  @IsOptional()
  @IsBoolean()
  isANCCompliant?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastANCVisitDate?: Date;

  // Postpartum Tracking
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  postpartumFollowUpDate?: Date;

  @IsOptional()
  @IsBoolean()
  postpartumFollowUpCompleted?: boolean;

  @IsOptional()
  @IsString()
  postpartumNotes?: string;
}
