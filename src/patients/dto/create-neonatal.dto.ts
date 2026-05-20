import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateNeonatalDto {
  @IsNotEmpty() @IsString() babyName: string;
  @IsNotEmpty() @IsString() babyDob: string;
  @IsOptional() @IsString() babyGender?: string;
  @IsOptional() @IsString() babyBirthWeight?: string;
  @IsOptional() @IsString() birthLength?: string;
  @IsOptional() @IsString() headCircumference?: string;
  @IsOptional() apgarScore?: number;
  @IsOptional() gestationalAgeAtBirth?: number;

  @IsOptional() @IsString() deliveryMethod?: string;
  @IsOptional() @IsString() placeOfBirth?: string;
  @IsOptional() @IsString() birthAttendant?: string;
  @IsOptional() @IsString() complicationsDuringDelivery?: string;

  @IsOptional() @IsString() prenatalPatientId?: string;

  @IsNotEmpty() @IsString() motherName: string;

  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid phone number.' })
  motherPhone: string;

  @IsOptional() @IsString() motherEmail?: string;
  @IsOptional() @IsString() motherAge?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() village?: string;
  @IsOptional() @IsString() facilityName?: string;
  @IsOptional() @IsString() emergencyContact?: string;

  /** Optional — if provided, a mobile User account is created for this patient */
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password?: string;
}
