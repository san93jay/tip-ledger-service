import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('Tips API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Idempotent tip intent creation', async () => {
    const payload = {
      merchantId: 'merchant-123',
      tableId: 'table-456',
      amountFils: 200,
      idempotencyKey: 'unique-key-abc',
    };

    const first = await request(app.getHttpServer())
      .post('/tips/intents')
      .send(payload)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/tips/intents')
      .send(payload)
      .expect(201);

    // Both responses should have the same intent ID
    expect(second.body.id).toEqual(first.body.id);
  });

  it('2. Concurrent confirmation safety', async () => {
    // Create a new intent
    const intentRes = await request(app.getHttpServer())
      .post('/tips/intents')
      .send({
        merchantId: 'merchant-123',
        tableId: 'table-456',
        amountFils: 300,
        idempotencyKey: 'concurrent-key-xyz',
      })
      .expect(201);

    const intentId = intentRes.body.id;

    // Fire two confirmations at the same time
    const [confirm1, confirm2] = await Promise.all([
      request(app.getHttpServer()).post(`/tips/intents/${intentId}/confirm`).send(),
      request(app.getHttpServer()).post(`/tips/intents/${intentId}/confirm`).send(),
    ]);

    // One should succeed, the other should be rejected or idempotent
    expect(confirm1.status).toBe(200);
    expect([200, 400]).toContain(confirm2.status);
  });

  it('3. Reversal behavior', async () => {
    // Create and confirm an intent
    const intentRes = await request(app.getHttpServer())
      .post('/tips/intents')
      .send({
        merchantId: 'merchant-123',
        tableId: 'table-456',
        amountFils: 150,
        idempotencyKey: 'reverse-key-789',
      })
      .expect(201);

    const intentId = intentRes.body.id;

    await request(app.getHttpServer())
      .post(`/tips/intents/${intentId}/confirm`)
      .send()
      .expect(200);

    // Reverse the confirmed intent
    const reverseRes = await request(app.getHttpServer())
      .post(`/tips/intents/${intentId}/reverse`)
      .send()
      .expect(200);

    expect(reverseRes.body.type).toBe('REVERSAL');
    expect(reverseRes.body.amountFils).toBe(-150);
  });
});