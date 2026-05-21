import { IsEnum, IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ReminderType, ReminderFrequency } from '../entities/reminder.entity';

export class CreateReminderDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsEnum(ReminderType)
  type: ReminderType;

  @IsEnum(ReminderFrequency)
  frequency: ReminderFrequency;

  @IsDateString()
  scheduledFor: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
