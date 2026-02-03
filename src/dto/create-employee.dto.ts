import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'employee@example.com',
    description: 'Unique email address of the employee',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePass123',
    description: 'Password must be at least 6 characters long',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Sanjay Vishwakarma',
    description: 'Full name of the employee',
  })
  @IsString()
  name: string;
}