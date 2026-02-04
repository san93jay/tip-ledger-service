import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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
  private readonly logger = new Logger(MerchantsService.name);
  constructor(
    @InjectRepository(TipIntent) private intentsRepo: Repository<TipIntent>,
    @InjectRepository(Merchant) private merchantsRepo: Repository<Merchant>,
    @InjectRepository(TableQR) private tablesRepo: Repository<TableQR>,
    @InjectRepository(Employee) private employeesRepo: Repository<Employee>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async createTable(merchantId: string, dto: CreateTableDto) {
    try{
      this.logger.log("create Table started");
      const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });
      if (!merchant) {
        this.logger.error("Merchant not found");
        throw new BadRequestException('Merchant not found');
      };

      const table = this.tablesRepo.create({ code: dto.code, merchant });
      await this.tablesRepo.save(table);
      this.logger.log("create Table completed");
      return { success: true, table };
  }catch (err) {
      this.logger.error('create Table Failed:', err.message);
      throw new InternalServerErrorException(err.message || 'Unexpected error');
   }
}

  async createEmployee(merchantId: string, dto: CreateEmployeeDto) {
    try{
      this.logger.log("create employee started");
      const merchant = await this.merchantsRepo.findOne({ where: { id: merchantId } });
      if (!merchant){
         this.logger.error("Merchant not found");
         throw new BadRequestException('Merchant not found');
      }

      const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
      if (existing) {
        this.logger.error("Email already exists");
        throw new BadRequestException('Email already exists');
      }

      const hashed = await bcrypt.hash(dto.password, 10);
      const user = this.usersRepo.create({
        email: dto.email,
        password: hashed,
        role: 'employee',
        name: dto.name,
      });
      await this.usersRepo.save(user);
      this.logger.log("create user saved into DB");
      const employee = this.employeesRepo.create({ name: dto.name, user, merchant });
      await this.employeesRepo.save(employee);
      this.logger.debug("create employee saved into DB");
      
      user.employee = employee;
      await this.usersRepo.save(user);
      this.logger.log("create employee completed");
      return { success: true, employee };
    }catch (err) {
      this.logger.error('create employee Failed:', err.message);
      throw new InternalServerErrorException(err.message || 'Unexpected error');
   }
  }

  async getTipSummary(merchantId: string) {
    try{
      this.logger.log("Get Tip Summary Started");
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
    this.logger.log("Get Tip Summary completed");
    return { merchantId, summary };
    }catch (err) {
      this.logger.error('Get Tip Summary Failed:', err.message);
      throw new InternalServerErrorException(err.message || 'Unexpected error');
   }
  }

 async listEmployees(merchantId: string) {
  try{
      this.logger.log("List Employees started");
      const merchant = await this.merchantsRepo.findOne({
        where: { id: merchantId },
        relations: ['employees', 'employees.user'],
      });
      if (!merchant) {
        this.logger.error("Merchant not found");
        throw new NotFoundException('Merchant not found');
      }
      this.logger.debug("Merchant Id for list employee:"+ merchantId);
      this.logger.log("List Employees completed");
      return merchant.employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.user.email,
      }));
    }catch (err) {
       this.logger.error('List Employees Failed:', err.message);
        throw new InternalServerErrorException(err.message || 'Unexpected error');
    }
 }

  async listTables(merchantId: string) {
    try{
      this.logger.log("List Tables Started");
      const merchant = await this.merchantsRepo.findOne({
        where: { id: merchantId },
        relations: ['tables'],
      });
      if (!merchant) {
        this.logger.error('Merchant not found');
        throw new NotFoundException('Merchant not found');
      }
      this.logger.log("List Tables Completed");
      return merchant.tables.map(table => ({
        id: table.id,
        code: table.code,
      }));
    
    }catch (err) {
        this.logger.error('List Tables Failed:', err.message);
        throw new InternalServerErrorException(err.message || 'Unexpected error');
    }
  }
}