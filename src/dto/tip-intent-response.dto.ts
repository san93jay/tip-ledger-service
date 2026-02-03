import { TipStatus } from '../entities/TipIntent.entity';

export class TipIntentResponseDto {
  id: string;
  merchantId: string;
  tableCode: string;
  amountFils: number;
  idempotencyKey: string;
  employeeHint?: string;
  status: TipStatus;
  createdAt: Date;

  employee?: {
    id: string;
    name: string;
  };

  table?: {
    id: string;
    code: string;
  };
}