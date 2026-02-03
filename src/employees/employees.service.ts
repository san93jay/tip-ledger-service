import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from 'src/entities/LedgerEntry.entity';
import { Employee } from '../entities/Employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee) private employeesRepo: Repository<Employee>,
    @InjectRepository(LedgerEntry) private ledgerRepo: Repository<LedgerEntry>,
  ) {}

async getEmployeeTips(employeeId: string, user: any) {
  // Verify employee exists
  const employee = await this.employeesRepo.findOne({
    where: { id: employeeId },
    relations: ['merchant'],
  });
  if (!employee) throw new NotFoundException('Employee not found');

  // Ownership check
  if (user.role === 'employee' && user.employeeId !== employeeId) {
    throw new ForbiddenException('You can only view your own tips');
  }
  if (user.role === 'merchant' && user.merchantId !== employee.merchant.id) {
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
}
}