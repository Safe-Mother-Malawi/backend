import { IsString, IsNotEmpty, IsEnum, IsArray, IsOptional, IsDateString } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateBroadcastDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsString()
  @IsNotEmpty()
  broadcastType: string;

  @IsString()
  @IsOptional()
  targetRole?: string;

  @IsString()
  @IsOptional()
  targetDistrict?: string;

  @IsString()
  @IsOptional()
  targetFacilityId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetUserIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deliveryChannels?: string[];

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
