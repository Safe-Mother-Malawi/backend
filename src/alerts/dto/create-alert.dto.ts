import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AlertSeverity } from '../entities/alert.entity';

export class CreateAlertDto {
  @IsNotEmpty() @IsString() patientName: string;
  @IsNotEmpty() @IsString() patientStatus: string;
  @IsNotEmpty() @IsString() contact: string;
  @IsNotEmpty() @IsString() reason: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  symptoms?: string[];

  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @IsOptional() @IsString() patientId?: string;

  /** Patient's district — used to route the alert to the right clinicians */
  @IsOptional() @IsString() district?: string;

  /** Patient's health facility — used to route the alert to the right clinicians */
  @IsOptional() @IsString() facilityName?: string;
}
