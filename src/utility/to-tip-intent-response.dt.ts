// src/mappers/tip-intent.mapper.ts
import { TipIntent } from 'src/entities/TipIntent.entity';
import { TipIntentResponseDto } from 'src/dto/tip-intent-response.dto';

export class TipIntentMapper {
  static toResponseDto(entity: TipIntent): TipIntentResponseDto {
    return {
      id: entity.id,
      merchantId: entity.merchantId,
      tableCode: entity.table?.code ?? '',
      amountFils: entity.amountFils,
      idempotencyKey: entity.idempotencyKey,
      employeeHint: entity.employeeHint,
      status: entity.status,
      createdAt: entity.createdAt,
      employee: entity.employee
        ? { id: entity.employee.id, name: entity.employee.name }
        : undefined,
      table: entity.table
        ? { id: entity.table.id, code: entity.table.code }
        : undefined,
    };
  }
}