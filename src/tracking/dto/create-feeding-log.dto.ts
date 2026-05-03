import { IsEnum, IsISO8601, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { FeedType } from '../entities/feeding-log.entity';

export class CreateFeedingLogDto {
  @IsNotEmpty() @IsString() neonatalPatientId: string;

  @IsEnum(FeedType)
  feedType: FeedType;

  @IsOptional() @IsInt() @Min(0) volumeMl?: number;
  @IsOptional() @IsInt() @Min(0) durationMin?: number;

  @IsISO8601() feedTime: string;
}
