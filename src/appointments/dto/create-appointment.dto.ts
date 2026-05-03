import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppointmentType, AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsNotEmpty() @IsString() title: string;
  @IsNotEmpty() @IsString() patientName: string;
  @IsNotEmpty() @IsString() patientContact: string;
  @IsOptional() @IsString() patientStatus?: string;

  @IsEnum(AppointmentType)
  type: AppointmentType;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsNotEmpty() @IsString() date: string; // YYYY-MM-DD
  @IsOptional() @IsString() time?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() doctor?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() prenatalPatientId?: string;
  @IsOptional() @IsString() neonatalPatientId?: string;
  @IsOptional() @IsString() clinicianId?: string;
}
