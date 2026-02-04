import { LedgerType } from 'src/entities/LedgerEntry.entity';
import { TipStatus } from 'src/entities/TipIntent.entity';

export interface TipIntentCreatedEvent {
  event: 'TIP_INTENT_CREATED';
  payload: {
    tipIntentId: string;
    amountFils: number;
    status: TipStatus;
  };
}

export interface TipConfirmedEvent {
  event: 'TIP_CONFIRMED';
  payload: {
    tipIntentId: string;
    amountFils: number;
    type: LedgerType.CONFIRM;
    status: TipStatus.CONFIRMED;
  };
}

export interface TipReversedEvent {
  event: 'TIP_REVERSED';
  payload: {
    tipIntentId: string;
    amountFils: number;
    type: LedgerType.REVERSAL;
    status: TipStatus.REVERSED;
  };
}

export type TipEvent =
  | TipIntentCreatedEvent
  | TipConfirmedEvent
  | TipReversedEvent;