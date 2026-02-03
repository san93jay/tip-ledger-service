import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Merchant } from '../entities/Merchant.entity';
import { TipIntent } from '../entities/TipIntent.entity';
import { User } from './user.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Merchant, merchant => merchant.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @OneToMany(() => TipIntent, tipIntent => tipIntent.employee)
  tipIntents: TipIntent[];

  @OneToOne(() => User, user => user.employee, { cascade: true })
  @JoinColumn()
  user: User;
  

}