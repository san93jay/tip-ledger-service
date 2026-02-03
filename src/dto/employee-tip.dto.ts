import { ApiProperty } from '@nestjs/swagger';
import { LedgerType } from '../entities/LedgerEntry.entity';

export class EmployeeLedgerEntryDto {
  @ApiProperty({ example: '6f100a95-cb32-4080-a002-d10f26002723' })
  id: string;

  @ApiProperty({ example: 200, description: 'Tip amount in fils' })
  amountFils: number;

  @ApiProperty({ enum: LedgerType, example: LedgerType.CONFIRM })
  type: LedgerType;

  @ApiProperty({ example: '2026-02-02T23:28:56.505Z' })
  createdAt: Date;
}

export class EmployeeTipsDto {
  @ApiProperty({ example: '4a1b5285-1cc3-4f5e-96ec-a708e8f3fcc0' })
  employeeId: string;

  @ApiProperty({ example: 200, description: 'Total tips amount in fils' })
  total: number;

  @ApiProperty({ type: () => [EmployeeLedgerEntryDto] })
  entries: EmployeeLedgerEntryDto[];
}