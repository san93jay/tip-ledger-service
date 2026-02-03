import { ApiProperty } from '@nestjs/swagger';
import { TipStatus } from '../entities/TipIntent.entity';

export class TipIntentResponseDto {
  @ApiProperty({ example: '6f100a95-cb32-4080-a002-d10f26002723' })
  id: string;

  @ApiProperty({ example: 'cf042c8f-a341-4840-aa26-d08235eba7fa' })
  merchantId: string;

  @ApiProperty({ example: 'T1', description: 'Table code where the tip was given' })
  tableCode: string;

  @ApiProperty({ example: 200, description: 'Tip amount in fils' })
  amountFils: number;

  @ApiProperty({ example: 'unique-idempotency-key-123' })
  idempotencyKey: string;

  @ApiProperty({ example: 'Sanjay', required: false })
  employeeHint?: string;

  @ApiProperty({ enum: TipStatus, example: TipStatus.CONFIRMED })
  status: TipStatus;

  @ApiProperty({ example: '2026-02-02T23:28:56.505Z' })
  createdAt: Date;

  @ApiProperty({
    example: { id: '4a1b5285-1cc3-4f5e-96ec-a708e8f3fcc0', name: 'Sanjay Vishwakarma' },
    required: false,
  })
  employee?: { id: string; name: string };

  @ApiProperty({
    example: { id: 'cf042c8f-a341-4840-aa26-d08235eba7fa', code: 'T1' },
    required: false,
  })
  table?: { id: string; code: string };
}