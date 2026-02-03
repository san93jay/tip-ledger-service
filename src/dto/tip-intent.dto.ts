import { ApiProperty } from '@nestjs/swagger';
import { TipStatus } from 'src/entities/TipIntent.entity';

export class TipIntentDto {
  @ApiProperty({
    example: '6f100a95-cb32-4080-a002-d10f26002723',
    description: 'Unique identifier for the tip intent',
  })
  id: string;

  @ApiProperty({
    example: 'cf042c8f-a341-4840-aa26-d08235eba7fa',
    description: 'Merchant ID associated with the tip',
  })
  merchantId: string;

  @ApiProperty({
    example: 'table-uuid-123',
    description: 'Table ID where the tip was given',
  })
  tableId: string;

  @ApiProperty({
    example: 200,
    description: 'Tip amount in fils',
  })
  amountFils: number;

  @ApiProperty({
    enum: TipStatus,
    example: TipStatus.CONFIRMED,
    description: 'Current status of the tip intent',
  })
  status: TipStatus;
}