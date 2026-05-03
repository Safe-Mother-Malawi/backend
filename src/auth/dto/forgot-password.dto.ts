import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class GetSecurityQuestionDto {
  @IsNotEmpty()
  @IsString()
  identifier: string; // phone or email
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  identifier: string; // phone or email

  @IsNotEmpty()
  @IsString()
  securityAnswer: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;
}

// Email-based forgot password flow
export class RequestPasswordResetDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResetPasswordWithTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
