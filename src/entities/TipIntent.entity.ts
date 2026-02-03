import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Employee } from '../entities/Employee.entity';
import { TableQR } from '../tables/TableQR.entity';
import { LedgerEntry } from '../entities/LedgerEntry.entity';

export enum TipStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REVERSED = 'REVERSED',
}

@Entity('tip_intents')
export class TipIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column()
  amountFils: number;

  @Column({ unique: true })
  idempotencyKey: string;

  @Column({
    type: 'enum',
    enum: TipStatus,
    default: TipStatus.PENDING,
  })
  status: TipStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  employeeHint?: string;

  @ManyToOne(() => Employee, employee => employee.tipIntents, { nullable: true })
  employee?: Employee | null;

  @ManyToOne(() => TableQR, table => table.tipIntents)
  table: TableQR;

  @OneToMany(() => LedgerEntry, ledger => ledger.tipIntent)
  ledgerEntries: LedgerEntry[];
}