import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LedgerEntry, LedgerType } from 'src/entities/LedgerEntry.entity';
import { TipIntent, TipStatus } from 'src/entities/TipIntent.entity';
import { Repository } from 'typeorm';

describe('Employee Tips (e2e)', () => {
  let app: INestApplication;
  let tipRepo: Repository<TipIntent>;
  let ledgerRepo: Repository<LedgerEntry>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    tipRepo = moduleFixture.get<Repository<TipIntent>>(getRepositoryToken(TipIntent));
    ledgerRepo = moduleFixture.get<Repository<LedgerEntry>>(getRepositoryToken(LedgerEntry));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return employee tips with ledger entries and totals', async () => {
    const employeeId = 'employee-uuid';

    const intent = await tipRepo.save({
      merchantId: 'merchant-uuid',
      tableId: 'T1',
      amountFils: 300,
      idempotencyKey: 'emp-1',
      status: TipStatus.CONFIRMED,
      employeeId,
    });

    await ledgerRepo.save({
      tipIntent: intent,
      employeeId,
      amountFils: 300,
      type: LedgerType.CONFIRM,
    });

    const res = await request(app.getHttpServer())
      .get(`/employees/${employeeId}/tips`)
      .expect(200);

    expect(res.body).toHaveProperty('total');
    expect(res.body.total).toBeGreaterThanOrEqual(300);
    expect(res.body.entries.length).toBeGreaterThanOrEqual(1);
    expect(res.body.entries[0].type).toEqual('CONFIRM');
  });
});