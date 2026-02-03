// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   ManyToOne,
//   JoinColumn,
// } from 'typeorm';
// import { TipIntent } from './TipIntent.entity';
// import { Employee } from './Employee.entity';

// export enum LedgerType {
//   CONFIRM = 'CONFIRM',
//   REVERSAL = 'REVERSAL',
// }

// // @Entity('ledger_entries')
// // export class LedgerEntry {
// //   @PrimaryGeneratedColumn('uuid')
// //   id: string;

// //   @ManyToOne(() => TipIntent, intent => intent.ledgerEntries, { eager: true })
// //   @JoinColumn({ name: 'tip_intent_id' })
// //   tipIntent: TipIntent;

// //   @ManyToOne(() => Employee, employee => employee.ledgerEntries, { eager: true, nullable: true})
// //   @JoinColumn({ name: 'employee_id' })
// //   employee?: Employee | null;

// //   @Column()
// //   amountFils: number;

// //   @Column({ type: 'enum', enum: LedgerType })
// //   type: LedgerType;

// //   @CreateDateColumn()
// //   createdAt: Date;
// // }

// @Entity('ledger_entries')
// export class LedgerEntry {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @ManyToOne(() => TipIntent, intent => intent.ledgerEntries, { eager: true })
//   @JoinColumn({ name: 'tip_intent_id' })
//   tipIntent: TipIntent;

//   @ManyToOne(() => Employee, employee => employee.ledgerEntries, { eager: true, nullable: true })
//   @JoinColumn({ name: 'employee_id' })
//   employee: Employee | null;
  
//   @Column()
//   amountFils: number;

//   @Column({ type: 'enum', enum: LedgerType })
//   type: LedgerType;

//   @CreateDateColumn()
//   createdAt: Date;
// }

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { TipIntent } from '../entities/TipIntent.entity';
import { Employee } from './Employee.entity';
export enum LedgerType {
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