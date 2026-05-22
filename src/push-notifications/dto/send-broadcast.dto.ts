import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';

export class SendBroadcastDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsArray()
  @IsOptional()
  userIds?: string[];

  @IsString()
  @IsOptional()
  recipientRole?: 'patient' | 'clinician' | 'admin' | 'all';

  @IsString()
  @IsOptional()
  recipientFacility?: string;
}
