import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TipIntent, TipStatus } from '../../src/entities/TipIntent.entity';
import { Repository } from 'typeorm';

describe('EmployeesController (e2e)', () => {
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

  // 1. Employee tips retrieval
  it('should return tips for a given employee', async () => {
    const employeeId = 'emp-uuid-1';

    await tipRepo.save([
      {
        id: 'tip1',
        merchantId: 'm1',
        tableId: 'T1',
        employeeId,
        amountFils: 100,
        idempotencyKey: 'emp-tip-1',
        status: TipStatus.CONFIRMED,
      },
      {
        id: 'tip2',
        merchantId: 'm1',
        tableId: 'T2',
        employeeId,
        amountFils: 200,
        idempotencyKey: 'emp-tip-2',
        status: TipStatus.PENDING,
      },
    ]);

    const res = await request(app.getHttpServer())
      .get(`/employees/${employeeId}/tips`)
      .set('Authorization', `Bearer test-token`)
      .expect(200);

    expect(res.body).toHaveProperty('employeeId', employeeId);
    expect(res.body).toHaveProperty('entries');
    expect(Array.isArray(res.body.entries)).toBe(true);
    expect(res.body.entries.length).toBeGreaterThanOrEqual(2);
  });

  // 2. Handling of missing employee
  it('should return 404 if employee has no tips', async () => {
    const res = await request(app.getHttpServer())
      .get(`/employees/non-existent-id/tips`)
      .set('Authorization', `Bearer test-token`)
      .expect(404);

    expect(res.body.message).toContain('Tip intent not found');
  });

  // 3. Tips grouped correctly
  it('should calculate total tips amount', async () => {
    const employeeId = 'emp-uuid-2';

    await tipRepo.save([
      {
        id: 'tip3',
        merchantId: 'm1',
        tableId: 'T3',
        employeeId,
        amountFils: 150,
        idempotencyKey: 'emp-tip-3',
        status: TipStatus.CONFIRMED,
      },
      {
        id: 'tip4',
        merchantId: 'm1',
        tableId: 'T4',
        employeeId,
        amountFils: 250,
        idempotencyKey: 'emp-tip-4',
        status: TipStatus.CONFIRMED,
      },
    ]);

    const res = await request(app.getHttpServer())
      .get(`/employees/${employeeId}/tips`)
      .set('Authorization', `Bearer test-token`)
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(400);
  });
});