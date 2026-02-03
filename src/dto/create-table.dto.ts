import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty({
    example: 'T1',
    description: 'Unique code for the table (e.g., T1, T2)',
  })
  @IsString()
  code: string;
}