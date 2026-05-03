import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreatePrenatalDto {
  @IsNotEmpty() @IsString() fullName: string;

  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid phone number.' })
  phone: string;

  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() age?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() facilityName?: string;
  @IsOptional() @IsString() lmpDate?: string;
  @IsOptional() @IsString() pregnancyMonths?: string;
  @IsOptional() @IsString() pregnancyWeeks?: string;
  @IsOptional() @IsString() expectedDeliveryDate?: string;

  /** Optional — if provided, a mobile User account is created for this patient */
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password?: string;
}
