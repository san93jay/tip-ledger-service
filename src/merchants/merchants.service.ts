import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipIntent, TipStatus } from 'src/entities/TipIntent.entity';
import { CreateEmployeeDto } from 'src/dto/create-employee.dto';
import { CreateTableDto } from 'src/dto/create-table.dto';
import { Employee } from 'src/entities/Employee.entity';
import { Merchant } from 'src/entities/Merchant.entity';
import { TableQR } from 'src/tables/TableQR.entity';
import { User } from 'src/entities/user.entity';
import * as bcrypt from 'bcrypt';


@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(TipIntent) private intentsRepo: Repository<TipIntent>,
    @InjectRepository(Merchant) private merchantsRepo: Repository<Merchant>,
    @InjectRepository(TableQR) private tablesRepo: Repository<TableQR>,
    @InjectRepository(Employee) private employeesRepo: Repository<Employee>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async createTable(merchantId: string, dto: CreateTableDto) {
    const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });
    if (!merchant) throw new BadRequestException('Merchant not found');

    const table = this.tablesRepo.create({ code: dto.code, merchant });
    await this.tablesRepo.save(table);

    return { success: true, table };
  }

  async createEmployee(merchantId: string, dto: CreateEmployeeDto) {
    const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });
    if (!merchant) throw new BadRequestException('Merchant not found');

    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      password: hashed,
      role: 'employee',
      name: dto.name,
    });
    await this.usersRepo.save(user);

    const employee = this.employeesRepo.create({ name: dto.name, user, merchant });
    await this.employeesRepo.save(employee);
    
    user.employee = employee;
    await this.usersRepo.save(user);

    return { success: true, employee };
  }

  async getTipSummary(merchantId: string) {
   
         const result = await this.intentsRepo
            .createQueryBuilder('tip')
            .select('tip.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(tip.amountFils)', 'totalAmountFils')
            .where('tip.merchant_id = :merchantId', { merchantId })
            .groupBy('tip.status')
            .getRawMany();

        // Transform into summary object
        const summary: Record<string, { count: number; totalAmountFils: number }> = {};
        result.forEach(r => {
            summary[r.status] = {
            count: Number(r.count),
            totalAmountFils: Number(r.totalAmountFils),
            };
        });

        return { merchantId, summary };
        }

 async listEmployees(merchantId: string) {
    const merchant = await this.merchantsRepo.findOne({
      where: { id: merchantId },
      relations: ['employees', 'employees.user'],
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    console.log("Merchant Id list employee:"+ merchantId);
    return merchant.employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.user.email,
    }));
  }

  async listTables(merchantId: string) {
    const merchant = await this.merchantsRepo.findOne({
      where: { id: merchantId },
      relations: ['tables'],
    });
    if (!merchant) throw new NotFoundException('Merchant not found');

    return merchant.tables.map(table => ({
      id: table.id,
      code: table.code,
    }));
  }
}