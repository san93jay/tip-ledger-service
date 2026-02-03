import { LedgerType } from '../entities/LedgerEntry.entity';

export class EmployeeLedgerEntryDto {
  id: string;
  amountFils: number;
  type: LedgerType;
  createdAt: Date;
}

export class EmployeeTipsDto {
  employeeId: string;
  total: number;
  entries: EmployeeLedgerEntryDto[];
}