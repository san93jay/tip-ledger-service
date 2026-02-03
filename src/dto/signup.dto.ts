import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';
export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['merchant','employee'])
  role: 'merchant'|'employee';

  @IsString()
  name: string;
}