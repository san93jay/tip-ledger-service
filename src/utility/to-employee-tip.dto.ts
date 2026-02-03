import { LedgerEntry } from '../entities/LedgerEntry.entity';
import { EmployeeTipsDto, EmployeeLedgerEntryDto } from '../dto/employee-tip.dto';

export function toEmployeeTipsDto(employeeId: string, entries: LedgerEntry[]): EmployeeTipsDto {
  return {
    employeeId,
    total: entries.reduce((sum, e) => sum + e.amountFils, 0),
    entries: entries.map((e): EmployeeLedgerEntryDto => ({
      id: e.id,
      amountFils: e.amountFils,
      type: e.type,
      createdAt: e.createdAt,
    })),
  };
}