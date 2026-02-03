import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { Employee } from '../entities/Employee.entity';
import { TableQR } from '../tables/TableQR.entity';
import { User } from './user.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Employee, employee => employee.merchant,{ onDelete: 'CASCADE' })
  employees: Employee[];

  @OneToMany(() => TableQR, table => table.merchant)
  tables: TableQR[];

  @OneToOne(() => User, user => user.merchant)
  user: User;
}
