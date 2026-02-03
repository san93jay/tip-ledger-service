import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository , DataSource} from 'typeorm';
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
  constructor(
    @InjectRepository(TipIntent)
    private readonly tipRepo: Repository<TipIntent>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepo: Repository<LedgerEntry>,
    @InjectRepository(TableQR)
    private readonly tableRepo : Repository<TableQR>,
    @InjectRepository(Merchant)
    private readonly merchantsRepo: Repository<Merchant>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly dataSource: DataSource,
    private publisher: EventsPublisher,
  ) {}

  async createTipIntent(dto: CreateTipIntentDto): Promise<TipIntent> {
  return this.dataSource.transaction(async manager => {
    // Idempotency check inside transaction
    const existing = await manager.findOne(TipIntent, {
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) return existing;

    const merchant = await manager.findOne(Merchant, { where: { id: dto.merchantId } });
    if (!merchant) throw new BadRequestException('Merchant not found');

    const table = await manager.findOne(TableQR, {
      where: { code: dto.tableCode, merchant: { id: dto.merchantId } },
    });
    if (!table) throw new BadRequestException('Table not found');

    let employee: Employee | null = null;
    if (dto.employeeHint) {
      employee = await manager.findOne(Employee, {
        where: { merchant: { id: dto.merchantId }, name: dto.employeeHint },
      });
    }
   console.log("employee :"+ employee?.name);
    const intent = manager.create(TipIntent, {
      merchantId: dto.merchantId,
      table,
      employee,
      amountFils: dto.amountFils,
      idempotencyKey: dto.idempotencyKey,
      status: TipStatus.PENDING,
      employeeHint: dto.employeeHint ?? undefined,
    });

    const finalIntent= manager.save(intent);
    await this.publisher.publish('TIP_PENDING', intent);
    return finalIntent;
  });
}

async confirmTipIntent(id: string): Promise<LedgerResponseDto> {
   try {
        return this.dataSource.transaction(async manager => {
          console.log("id is :" + id);
          const intent = await manager.findOne(TipIntent, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      console.log(intent);
      if (!intent) throw new NotFoundException('Tip intent not found');
      console.log("Status checking started");
      // idempotency check
      if (intent.status === TipStatus.CONFIRMED) {
        const existingLedger = await manager.findOne(LedgerEntry, {
          where: { tipIntent: { id }, type: LedgerType.CONFIRM },
          relations: ['tipIntent','tipIntent.employee','tipIntent.table'],
        });
        console.log("Status checking finished when same request");
        return toLedgerResponseDto(existingLedger!);
      }

      // update status
      intent.status = TipStatus.CONFIRMED;
      const saveIntent=await manager.save(intent);
      console.log("save intent :  " +saveIntent.status);

      // create ledger
      const ledger = manager.create(LedgerEntry, {
        tipIntent: intent,
        amountFils: intent.amountFils,
        type: LedgerType.CONFIRM,
      });
      const savedLedger = await manager.save(ledger);
      console.log("savedLedger :  " +savedLedger.type);
      // reload with relations
      const fullLedger = await manager.findOne(LedgerEntry, {
        where: { id: savedLedger.id },
        relations: ['tipIntent','tipIntent.employee','tipIntent.table'],
      });
      console.log("finished" + fullLedger?.type);
      await this.publisher.publish('TIP_CONFIRMED', fullLedger);
      return toLedgerResponseDto(fullLedger!);
     });
  } catch (err) {
    console.error('ConfirmTipIntent failed:', err.message);
    throw new InternalServerErrorException(err.message || 'Unexpected error');
  }

}

  async reverseTipIntent(id: string): Promise<LedgerResponseDto> {
  return this.dataSource.transaction(async manager => {
    // Lock the row to prevent race conditions
    const intent = await manager.findOne(TipIntent, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!intent) {
      throw new Error('Tip intent not found');
    }

    // If already reversed, return existing reversal ledger entry
    if (intent.status === TipStatus.REVERSED) {
      const existingLedger = await manager.findOne(LedgerEntry, {
        where: { tipIntent: { id }, type: LedgerType.REVERSAL },
        relations: ['tipIntent', 'tipIntent.employee', 'tipIntent.table'],
      });
      if (!existingLedger) {
        throw new Error('Ledger entry not found for reversed intent');
      }
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
    await this.publisher.publish('TIP_REVERSED', fullLedger);

    return toLedgerResponseDto(fullLedger!);
  });
}

}

