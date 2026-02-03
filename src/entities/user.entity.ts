import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../entities/Employee.entity';
import { Merchant } from '../entities/Merchant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['merchant', 'employee'] })
  role: 'merchant' | 'employee';

  @OneToOne(() => Employee, employee => employee.user, { nullable: true })
  @JoinColumn()
  employee?: Employee;

  @OneToOne(() => Merchant, merchant => merchant.user, { nullable: true })
  @JoinColumn()
  merchant?: Merchant;
}