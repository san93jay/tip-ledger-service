import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TipIntent, TipStatus } from 'src/entities/TipIntent.entity';
import { LedgerEntry, LedgerType } from 'src/entities/LedgerEntry.entity';
import { Repository } from 'typeorm';

describe('TipsController (e2e)', () => {
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

  it('should create a tip intent (idempotent)', async () => {
    const payload = {
      merchantId: 'merchant-uuid',
      tableCode: 'T1',
      amountFils: 200,
      idempotencyKey: 'abc-123',
    };

    const res1 = await request(app.getHttpServer())
      .post('/tips/intents')
      .send(payload)
      .expect(201);

    const res2 = await request(app.getHttpServer())
      .post('/tips/intents')
      .send(payload)
      .expect(201);

    expect(res1.body.id).toEqual(res2.body.id);
  });

  it('should confirm a tip intent (concurrency safe)', async () => {
    const intent = await tipRepo.save({
      merchantId: 'merchant-uuid',
      tableId: 'T1',
      amountFils: 300,
      idempotencyKey: 'xyz-789',
      status: TipStatus.PENDING,
    });

    const confirm1 = request(app.getHttpServer())
      .post(`/tips/intents/${intent.id}/confirm`);

    const confirm2 = request(app.getHttpServer())
      .post(`/tips/intents/${intent.id}/confirm`);

    const [res1, res2] = await Promise.all([confirm1, confirm2]);

    expect(res1.body.id).toEqual(res2.body.id);

    //check ledger relation
    const ledger = await ledgerRepo.findOne({
      where: { tipIntent: { id: intent.id }, type: LedgerType.CONFIRM },
    });
    expect(ledger).toBeDefined();
  });

  it('should reverse a tip intent', async () => {
    const intent = await tipRepo.save({
      merchantId: 'merchant-uuid',
      tableId: 'T1',
      amountFils: 150,
      idempotencyKey: 'rev-111',
      status: TipStatus.CONFIRMED,
    });

    const res = await request(app.getHttpServer())
      .post(`/tips/intents/${intent.id}/reverse`)
      .expect(201);

    expect(res.body.type).toEqual('REVERSAL');

    //check ledger relation
    const ledger = await ledgerRepo.findOne({
      where: { tipIntent: { id: intent.id }, type: LedgerType.REVERSAL },
    });
    expect(ledger).toBeDefined();
  });

  it('should return error for non-existent intent', async () => {
    const res = await request(app.getHttpServer())
      .post('/tips/intents/non-existent-id/confirm')
      .expect(500);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Tip intent not found');
  });
});