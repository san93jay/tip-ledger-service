import { ApiProperty } from '@nestjs/swagger';
import { LedgerType } from 'src/entities/LedgerEntry.entity';
import { TipIntentDto } from './tip-intent.dto';

export class LedgerResponseDto {
  @ApiProperty({ example: '6f100a95-cb32-4080-a002-d10f26002723' })
  id: string;

  @ApiProperty({ enum: LedgerType, example: LedgerType.CONFIRM })
  type: LedgerType;

  @ApiProperty({ example: 200, description: 'Amount in fils' })
  amountFils: number;

  @ApiProperty({ example: '2026-02-02T23:28:56.505Z' })
  createdAt: Date;

  @ApiProperty({ type: () => TipIntentDto })
  tipIntent: TipIntentDto;

  @ApiProperty({
    example: { id: '4a1b5285-1cc3-4f5e-96ec-a708e8f3fcc0', name: 'John Doe' },
    required: false,
  })
  employee?: { id: string; name: string };

  @ApiProperty({
    example: { id: 'cf042c8f-a341-4840-aa26-d08235eba7fa', code: 'T1' },
    required: false,
  })
  table?: { id: string; code: string };
}