import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password must be at least 6 characters long',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'merchant',
    description: 'Role of the user',
    enum: ['merchant', 'employee'],
  })
  @IsIn(['merchant', 'employee'])
  role: 'merchant' | 'employee';

  @ApiProperty({
    example: 'Sanjay Vishwakarma',
    description: 'Full name of the user',
  })
  @IsString()
  name: string;
}