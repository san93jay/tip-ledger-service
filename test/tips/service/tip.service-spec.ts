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
      transaction: jest.fn().mockImplementation(cb => cb({
        findOne: tipRepo.findOne,
        save: tipRepo.save,
        create: tipRepo.create,
      })),
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

  it('should confirm a pending tip intent', async () => {
    const intent: TipIntent = {
      id: '1',
      merchantId: 'm1',
      tableId: 'T1',
      employeeId: 'e1',
      amountFils: 200,
      idempotencyKey: 'abc',
      status: TipStatus.PENDING,
    } as any;

    tipRepo.findOne.mockResolvedValue(intent);
    tipRepo.save.mockResolvedValue({ ...intent, status: TipStatus.CONFIRMED });
    ledgerRepo.create.mockReturnValue({ id: 'ledger1' } as any);
    ledgerRepo.save.mockResolvedValue({ id: 'ledger1' } as any);

    const result = await service.confirmTipIntent('1');

    expect(result.id).toBe('ledger1');
    expect(events.emit).toHaveBeenCalledWith('TIP_CONFIRMED', expect.any(Object));
  });

  it('should return existing ledger entry if already confirmed', async () => {
    const intent: TipIntent = { id: '1', status: TipStatus.CONFIRMED } as any;
    const ledger: LedgerEntry = { id: 'ledger1', type: LedgerType.CONFIRM } as any;

    tipRepo.findOne.mockResolvedValue(intent);
    ledgerRepo.findOne.mockResolvedValue(ledger);

    const result = await service.confirmTipIntent('1');

    expect(result).toBe(ledger);
  });

  it('should reverse a confirmed tip intent', async () => {
    const intent: TipIntent = {
      id: '2',
      status: TipStatus.CONFIRMED,
      employeeId: 'e1',
      amountFils: 100,
    } as any;

    tipRepo.findOne.mockResolvedValue(intent);
    tipRepo.save.mockResolvedValue({ ...intent, status: TipStatus.REVERSED });
    ledgerRepo.create.mockReturnValue({ id: 'ledger2' } as any);
    ledgerRepo.save.mockResolvedValue({ id: 'ledger2' } as any);

    const result = await service.reverseTipIntent('2');

    expect(result.id).toBe('ledger2');
    expect(events.emit).toHaveBeenCalledWith('TIP_REVERSED', expect.any(Object));
  });

  it('should throw if tip intent not found', async () => {
    tipRepo.findOne.mockResolvedValue(null);

    await expect(service.confirmTipIntent('missing')).rejects.toThrow('Tip intent not found');
  });
});