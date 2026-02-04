import { ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from 'src/entities/LedgerEntry.entity';
import { Employee } from '../entities/Employee.entity';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);
  constructor(
    @InjectRepository(Employee) private employeesRepo: Repository<Employee>,
    @InjectRepository(LedgerEntry) private ledgerRepo: Repository<LedgerEntry>,
  ) {}

async getEmployeeTips(employeeId: string, user: any) {
  try{
    this.logger.log("Get Employee Tips started");
    // Verify employee exists
    const employee = await this.employeesRepo.findOne({
      where: { id: employeeId },
      relations: ['merchant'],
    });
    if (!employee){
      this.logger.error("Employee not found");
       throw new NotFoundException('Employee not found');
    }

    // Ownership check
    if (user.role === 'employee' && user.employeeId !== employeeId) {
      this.logger.debug("You can only view your own tips");
      throw new ForbiddenException('You can only view your own tips');
    }
    if (user.role === 'merchant' && user.merchantId !== employee.merchant.id) {
      this.logger.log("You can only view tips for your own employees");
      throw new ForbiddenException('You can only view tips for your own employees');
    }

    // Try to fetch ledger entries by employeeId
    let ledgerEntries = await this.ledgerRepo.find({
      where: { tipIntent: { employee: { id: employeeId } } },
      relations: ['tipIntent', 'tipIntent.employee', 'tipIntent.table'],
      order: { createdAt: 'DESC' },
    });

    // Fallback: if none found, fetch by merchantId
    if (ledgerEntries.length === 0) {
      ledgerEntries = await this.ledgerRepo.find({
        where: { tipIntent: { merchantId: employee.merchant.id } },
        relations: ['tipIntent', 'tipIntent.employee', 'tipIntent.table'],
        order: { createdAt: 'DESC' },
      });
    }

    // Calculate totals
    const total = ledgerEntries.reduce((sum, entry) => sum + entry.amountFils, 0);
    this.logger.log("Get Employee Tips Completed");
    return {
      employeeId,
      merchantId: employee.merchant.id,
      total,
      entries: ledgerEntries.map(entry => ({
        id: entry.id,
        type: entry.type,
        amountFils: entry.amountFils,
        createdAt: entry.createdAt,
        tipIntentId: entry.tipIntent.id,
        tableCode: entry.tipIntent.table?.code,
        name: entry.tipIntent.employee?.name ?? null,
      })),
    };
 }catch (err) {
       console.error('Get Employee Tips Failed:', err.message);
       throw new InternalServerErrorException(err.message || 'Unexpected error');
    }
}
}