import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateNeonatalDto {
  @IsNotEmpty() @IsString() babyName: string;
  @IsNotEmpty() @IsString() babyDob: string;
  @IsOptional() @IsString() babyGender?: string;
  @IsOptional() @IsString() babyBirthWeight?: string;

  @IsNotEmpty() @IsString() motherName: string;

  @IsNotEmpty()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter a valid phone number.' })
  motherPhone: string;

  @IsOptional() @IsString() motherEmail?: string;
  @IsOptional() @IsString() motherAge?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() facilityName?: string;

  /** Optional — if provided, a mobile User account is created for this patient */
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password?: string;
}
