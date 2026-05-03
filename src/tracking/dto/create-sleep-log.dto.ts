import { IsEnum, IsISO8601, IsNotEmpty, IsString } from 'class-validator';
import { SleepType } from '../entities/sleep-log.entity';

export class CreateSleepLogDto {
  @IsNotEmpty() @IsString() neonatalPatientId: string;

  @IsEnum(SleepType)
  sleepType: SleepType;

  @IsISO8601() startTime: string;
  @IsISO8601() endTime: string;
}
