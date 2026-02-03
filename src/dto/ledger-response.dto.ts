import { from } from "rxjs";
import {LedgerType} from 'src/entities/LedgerEntry.entity';
import { TipIntentDto } from "./tip-intent.dto";
export class LedgerResponseDto {
  id: string;
  type: LedgerType;
  amountFils: number;
  createdAt: Date;
  tipIntent: TipIntentDto;
  employee?: { id: string; name: string };
  table?: { id: string; code: string };
}
