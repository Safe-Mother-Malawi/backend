import { IsEnum, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { BusyReason } from '../entities/busy-response.entity';

export class MarkBusyDto {
  @IsEnum(BusyReason)
  reason: BusyReason;

  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @IsBoolean()
  rescheduleRequested?: boolean;

  @IsOptional()
  @IsDateString()
  preferredRescheduleDate?: string;

  @IsOptional()
  @IsString()
  preferredRescheduleTime?: string;
}
