import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { TipIntent } from '../entities/TipIntent.entity';
export enum LedgerType {
  INTENT = 'INTENT',
  CONFIRM = 'CONFIRM',
  REVERSAL = 'REVERSAL',
}

@Entity('ledger_entries')
@Unique(['tipIntent', 'type'])
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: LedgerType })
  type: LedgerType;

  @Column()
  amountFils: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => TipIntent, tipIntent => tipIntent.ledgerEntries)
  tipIntent: TipIntent;
  
}