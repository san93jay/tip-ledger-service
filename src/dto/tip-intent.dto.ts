import { TipStatus } from "src/entities/TipIntent.entity";
export class TipIntentDto {
  id: string;
  merchantId: string;
  tableId: string;
  amountFils: number;
  status: TipStatus;
}