import { IsUUID, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateTipIntentDto {
  @IsUUID()
  merchantId: string;

  @IsString()
  tableCode: string;

  @IsInt()
  amountFils: number;

  @IsString()
  idempotencyKey: string;

  @IsOptional()
  @IsString()
  employeeHint?: string;
}