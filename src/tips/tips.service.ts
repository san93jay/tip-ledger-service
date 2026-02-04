import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DataSource} from 'typeorm';
import { TipIntent, TipStatus } from 'src/entities/TipIntent.entity';
import { CreateTipIntentDto } from '../dto/create-tip-intent.dto';
import { LedgerEntry , LedgerType} from 'src/entities/LedgerEntry.entity';
import { EventsPublisher } from '../messaging/events.publisher';
import { LedgerResponseDto } from 'src/dto/ledger-response.dto';
import { toLedgerResponseDto } from 'src/utility/to-ledger-response.dto';
import { Employee } from 'src/entities/Employee.entity';
import { TableQR } from 'src/tables/TableQR.entity';
import { Merchant } from 'src/entities/Merchant.entity';

@Injectable()
export class TipsService {
  private readonly logger = new Logger(TipsService.name);
  constructor(
    private readonly dataSource: DataSource,
    private publisher: EventsPublisher,
  ) {}

  async createTipIntent(dto: CreateTipIntentDto): Promise<TipIntent> {
    try{
     this.logger.log("Create Tip Intent Started");
      return this.dataSource.transaction(async manager => {
        // Idempotency check inside transaction
        const existing = await manager.findOne(TipIntent, {
          where: { idempotencyKey: dto.idempotencyKey },
        });
        if (existing){
         this.logger.debug("Tip Intent Already existing ");
         return existing;
        }

        const merchant = await manager.findOne(Merchant, { where: { id: dto.merchantId } });
        if (!merchant){
          this.logger.debug("Merchant not found");
          throw new BadRequestException('Merchant not found');
        }

        const table = await manager.findOne(TableQR, {
          where: { code: dto.tableCode, merchant: { id: dto.merchantId } },
        });
        if (!table){ 
          this.logger.debug("Table not found");
          throw new BadRequestException('Table not found')
        };

        let employee: Employee | null = null;
        if (dto.employeeHint) {
          employee = await manager.findOne(Employee, {
            where: { merchant: { id: dto.merchantId }, name: dto.employeeHint },
          });
        }
        const intent = manager.create(TipIntent, {
          merchantId: dto.merchantId,
          table,
          employee,
          amountFils: dto.amountFils,
          idempotencyKey: dto.idempotencyKey,
          status: TipStatus.PENDING,
          employeeHint: dto.employeeHint ?? undefined,
        });
    const finalIntent = await manager.save(intent);
    this.logger.debug("Intent saved successfully");
    await this.publisher.publish('TIP_INTENT_CREATED', {
            tipIntentId: finalIntent.id,
            amountFils: finalIntent.amountFils,
            status: finalIntent.status,
          });
    this.logger.log("Create Tip Intent Completed");
    return finalIntent;
  });
 }catch (err) {
    this.logger.error('create TipIntent Failed:', err.message);
    throw new InternalServerErrorException(err.message || 'Unexpected error');
 }
}

async confirmTipIntent(id: string): Promise<LedgerResponseDto> {
   try {
    this.logger.log("Confirm Tip Intent Started");
        return this.dataSource.transaction(async manager => {
          this.logger.debug("id is :" + id);
          const intent = await manager.findOne(TipIntent, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!intent){
       this.logger.error("Tip intent not found");
       throw new NotFoundException('Tip intent not found');
      } 
      this.logger.debug("Status checking started");
      // idempotency check
      if (intent.status === TipStatus.CONFIRMED) {
        const existingLedger = await manager.findOne(LedgerEntry, {
          where: { tipIntent: { id }, type: LedgerType.CONFIRM },
          relations: ['tipIntent','tipIntent.employee','tipIntent.table'],
        });
        this.logger.debug("Status checking finished when same request");
        return toLedgerResponseDto(existingLedger!);
      }

      // update status
      intent.status = TipStatus.CONFIRMED;
      const saveIntent=await manager.save(intent);
      this.logger.debug("save intent :  " +saveIntent.status);

      // create ledger
      const ledger = manager.create(LedgerEntry, {
        tipIntent: intent,
        amountFils: intent.amountFils,
        type: LedgerType.CONFIRM,
      });
      const savedLedger = await manager.save(ledger);
      this.logger.debug("savedLedger :  " +savedLedger.type);
      // reload with relations
      const fullLedger = await manager.findOne(LedgerEntry, {
        where: { id: savedLedger.id },
        relations: ['tipIntent','tipIntent.employee','tipIntent.table'],
      });
      this.logger.debug("finished" + fullLedger?.type);
      await this.publisher.publish('TIP_CONFIRMED', {
        tipIntentId: fullLedger?.tipIntent.id,
        amountFils: fullLedger?.amountFils,
        status: fullLedger?.tipIntent.status,
        type: LedgerType.CONFIRM
      });
      this.logger.log("Confirm Tip Intent Completed");
      return toLedgerResponseDto(fullLedger!);
     });
  } catch (err) {
    this.logger.error('Confirm TipIntent Failed:', err.message);
    throw new InternalServerErrorException(err.message || 'Unexpected error');
  }

}

  async reverseTipIntent(id: string): Promise<LedgerResponseDto> {
    try{
      this.logger.log("Reverse Tip Intent Started");
      return this.dataSource.transaction(async manager => {
        // Lock the row to prevent race conditions
        const intent = await manager.findOne(TipIntent, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!intent) {
          this.logger.error("Tip intent not found");
          throw new Error('Tip intent not found');
        }

        // If already reversed, return existing reversal ledger entry
        if (intent.status === TipStatus.REVERSED) {
          const existingLedger = await manager.findOne(LedgerEntry, {
            where: { tipIntent: { id }, type: LedgerType.REVERSAL },
            relations: ['tipIntent', 'tipIntent.employee', 'tipIntent.table'],
          });
          if (!existingLedger) {
            this.logger.error("Ledger entry not found for reversed intent");
            throw new Error('Ledger entry not found for reversed intent');
          }
          this.logger.debug("Ledger entry already existing");
          return toLedgerResponseDto(existingLedger);
        }

        // Update intent status
        intent.status = TipStatus.REVERSED;
        await manager.save(intent);

        // Append reversal ledger entry with proper relations
        const ledger = manager.create(LedgerEntry, {
          tipIntent: intent,
          amountFils: intent.amountFils,
          type: LedgerType.REVERSAL,
        });
        await manager.save(ledger);

        // Reload with relations
        const fullLedger = await manager.findOne(LedgerEntry, {
          where: { id: ledger.id },
          relations: ['tipIntent','tipIntent.employee', 'tipIntent.table'],
        });

        // Emit RabbitMQ event
        await this.publisher.publish('TIP_REVERSED', {
            tipIntentId: fullLedger?.tipIntent.id,
            amountFils: fullLedger?.amountFils,
            status: fullLedger?.tipIntent.status,
            type: LedgerType.REVERSAL
          });
        this.logger.log("Reverse Tip Intent Completed");
        return toLedgerResponseDto(fullLedger!);
      });
  }catch (err) {
    this.logger.error('Reverse TipIntent Failed:', err.message);
    throw new InternalServerErrorException(err.message || 'Unexpected error');
  }
 }
}

