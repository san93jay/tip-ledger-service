import { IsUUID, IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTipIntentDto {
  @ApiProperty({
    example: 'cf042c8f-a341-4840-aa26-d08235eba7fa',
    description: 'Merchant ID (UUID)',
  })
  @IsUUID()
  merchantId: string;

  @ApiProperty({
    example: 'T1',
    description: 'Table code where the tip was given',
  })
  @IsString()
  tableCode: string;

  @ApiProperty({
    example: 200,
    description: 'Tip amount in fils',
  })
  @IsInt()
  amountFils: number;

  @ApiProperty({
    example: 'unique-idempotency-key-123',
    description: 'Idempotency key to ensure safe retries',
  })
  @IsString()
  idempotencyKey: string;

  @ApiProperty({
    example: 'Atharva',
    description: 'Optional employee name hint',
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeHint?: string;
}