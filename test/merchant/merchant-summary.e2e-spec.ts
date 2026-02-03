import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TipIntent, TipStatus } from 'src/entities/TipIntent.entity';
import { Repository } from 'typeorm';

describe('Merchant Tip Summary (e2e)', () => {
  let app: INestApplication;
  let tipRepo: Repository<TipIntent>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    tipRepo = moduleFixture.get<Repository<TipIntent>>(getRepositoryToken(TipIntent));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return merchant tip summary grouped by status', async () => {
    const merchantId = 'merchant-summary-uuid';

    await tipRepo.save([
      {
        merchantId,
        tableId: 'T1',
        amountFils: 100,
        idempotencyKey: 'sum-1',
        status: TipStatus.PENDING,
      },
      {
        merchantId,
        tableId: 'T2',
        amountFils: 200,
        idempotencyKey: 'sum-2',
        status: TipStatus.CONFIRMED,
      },
      {
        merchantId,
        tableId: 'T3',
        amountFils: 50,
        idempotencyKey: 'sum-3',
        status: TipStatus.REVERSED,
      },
    ]);

    const res = await request(app.getHttpServer())
      .get(`/merchants/${merchantId}/tips/summary`)
      .expect(200);

    expect(res.body).toHaveProperty('PENDING');
    expect(res.body).toHaveProperty('CONFIRMED');
    expect(res.body).toHaveProperty('REVERSED');
    expect(res.body.PENDING).toBeGreaterThanOrEqual(100);
    expect(res.body.CONFIRMED).toBeGreaterThanOrEqual(200);
    expect(res.body.REVERSED).toBeGreaterThanOrEqual(50);
  });
});