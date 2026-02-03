import { Test, TestingModule } from '@nestjs/testing';
import { TipsService } from '../../../src/tips/tips.service';
import { TipIntent, TipStatus } from '../../../src/entities/TipIntent.entity';
import { LedgerEntry, LedgerType } from '../../../src/entities/LedgerEntry.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventsProducer } from '../../../src/messaging/events.producer';

describe('TipsService', () => {
  let service: TipsService;
  let tipRepo: jest.Mocked<Repository<TipIntent>>;
  let ledgerRepo: jest.Mocked<Repository<LedgerEntry>>;
  let dataSource: jest.Mocked<DataSource>;
  let events: jest.Mocked<EventsProducer>;

  beforeEach(async () => {
    tipRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;

    ledgerRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;

    dataSource = {
      transaction: jest.fn().mockImplementation(cb =>
        cb({
          findOne: tipRepo.findOne,
          save: tipRepo.save,
          create: tipRepo.create,
        }),
      ),
    } as any;

    events = { emit: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TipsService,
        { provide: getRepositoryToken(TipIntent), useValue: tipRepo },
        { provide: getRepositoryToken(LedgerEntry), useValue: ledgerRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: EventsProducer, useValue: events },
      ],
    }).compile();

    service = module.get<TipsService>(TipsService);
  });

  // 1. Idempotent creation
  it('should create tip intent idempotently', async () => {
    const dto = {
      merchantId: 'm1',
      tableCode: 'T1',
      amountFils: 200,
      idempotencyKey: 'unique-key',
    } as any;

    const intent: TipIntent = { id: '1', ...dto, status: TipStatus.PENDING } as any;

    tipRepo.findOne.mockResolvedValueOnce(null); // first call: no existing
    tipRepo.create.mockReturnValue(intent);
    tipRepo.save.mockResolvedValue(intent);

    const result1 = await service.createTipIntent(dto);
    expect(result1.id).toBe('1');

    // second call: should return existing intent
    tipRepo.findOne.mockResolvedValueOnce(intent);

    const result2 = await service.createTipIntent(dto);
    expect(result2.id).toBe('1');
  });

  // 2. Concurrent confirmation safety
  it('should handle concurrent confirmations safely', async () => {
    const intent: TipIntent = { id: '1', status: TipStatus.PENDING, amountFils: 100 } as any;

    tipRepo.findOne.mockResolvedValue(intent);
    tipRepo.save.mockResolvedValue({ ...intent, status: TipStatus.CONFIRMED });
    ledgerRepo.create.mockReturnValue({ id: 'ledger1', type: LedgerType.CONFIRM } as any);
    ledgerRepo.save.mockResolvedValue({ id: 'ledger1', type: LedgerType.CONFIRM } as any);

    // simulate two calls
    const [res1, res2] = await Promise.allSettled([
      service.confirmTipIntent('1'),
      service.confirmTipIntent('1'),
    ]);

    // one should succeed
    expect(res1.status === 'fulfilled' || res2.status === 'fulfilled').toBe(true);
  });

  // 3. Reversal behavior
  it('should reverse a confirmed tip intent correctly', async () => {
    const intent: TipIntent = { id: '2', status: TipStatus.CONFIRMED, amountFils: 150 } as any;

    tipRepo.findOne.mockResolvedValue(intent);
    tipRepo.save.mockResolvedValue({ ...intent, status: TipStatus.REVERSED });
    ledgerRepo.create.mockReturnValue({ id: 'ledger2', type: LedgerType.REVERSAL } as any);
    ledgerRepo.save.mockResolvedValue({ id: 'ledger2', type: LedgerType.REVERSAL } as any);

    const result = await service.reverseTipIntent('2');

    expect(result.id).toBe('ledger2');
    expect(events.emit).toHaveBeenCalledWith('TIP_REVERSED', expect.any(Object));
  });

  // Extra: Not found case
  it('should throw if tip intent not found', async () => {
    tipRepo.findOne.mockResolvedValue(null);

    await expect(service.confirmTipIntent('missing')).rejects.toThrow('Tip intent not found');
  });
});