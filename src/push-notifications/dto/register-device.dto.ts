import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsIn(['mobile', 'web', 'desktop'])
  @IsOptional()
  platform?: 'mobile' | 'web' | 'desktop' = 'mobile';

  @IsString()
  @IsOptional()
  deviceName?: string;
}
