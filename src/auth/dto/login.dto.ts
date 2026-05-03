import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  /**
   * Phone number or email address.
   */
  @IsNotEmpty({ message: 'Phone number or email is required.' })
  @IsString()
  identifier: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString()
  password: string;
}
