import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Merchant } from '../entities/Merchant.entity';
import { TipIntent } from '../entities/TipIntent.entity';

@Entity('tables')
export class TableQR {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @ManyToOne(() => Merchant, merchant => merchant.tables)
  merchant: Merchant;

  @OneToMany(() => TipIntent, tipIntent => tipIntent.table)
  tipIntents: TipIntent[];
}
