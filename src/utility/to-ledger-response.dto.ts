import { LedgerEntry } from '../entities/LedgerEntry.entity';
import { LedgerResponseDto } from '../dto/ledger-response.dto';

export function toLedgerResponseDto(entry: LedgerEntry): LedgerResponseDto {
  return {
    id: entry.id,
    tipIntent: {
      id: entry.tipIntent.id,
      merchantId: entry.tipIntent.merchantId,
      tableId: entry.tipIntent.table.id,
      amountFils: entry.tipIntent.amountFils,
      status: entry.tipIntent.status,
    },
    amountFils: entry.amountFils,
    type: entry.type,
    createdAt: entry.createdAt,
  };
}