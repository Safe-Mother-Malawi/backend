import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsNotEmpty() @IsString() title: string;
  @IsNotEmpty() @IsString() body: string;
  @IsNotEmpty() @IsString() userId: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
