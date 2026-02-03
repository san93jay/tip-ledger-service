import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TipIntent, TipStatus } from 'src/entities/TipIntent.entity';
import { Employee } from 'src/entities/Employee.entity';
import { TableQR } from 'src/tables/TableQR.entity';
import { Repository } from 'typeorm';

describe('MerchantsController (e2e)', () => {
  let app: INestApplication;
  let tipRepo: Repository<TipIntent>;
  let employeeRepo: Repository<Employee>;
  let tableRepo: Repository<TableQR>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    tipRepo = moduleFixture.get<Repository<TipIntent>>(getRepositoryToken(TipIntent));
    employeeRepo = moduleFixture.get<Repository<Employee>>(getRepositoryToken(Employee));
    tableRepo = moduleFixture.get<Repository<TableQR>>(getRepositoryToken(TableQR));
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Tip summary aggregation
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

    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary).toHaveProperty('PENDING');
    expect(res.body.summary).toHaveProperty('CONFIRMED');
    expect(res.body.summary).toHaveProperty('REVERSED');
  });

  // 2. Employee creation and listing
  it('should create and list employees', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/merchants/employees')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secret' })
      .set('Authorization', `Bearer test-token`)
      .expect(201);

    expect(createRes.body.name).toBe('Alice');

    const listRes = await request(app.getHttpServer())
      .get('/merchants/employees')
      .set('Authorization', `Bearer test-token`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((e: any) => e.email === 'alice@example.com')).toBe(true);
  });

  it('should fail to create employee with duplicate email', async () => {
    await employeeRepo.save({ name: 'Bob', email: 'bob@example.com', password: 'secret' });

    const res = await request(app.getHttpServer())
      .post('/merchants/employees')
      .send({ name: 'Bob', email: 'bob@example.com', password: 'secret' })
      .set('Authorization', `Bearer test-token`)
      .expect(400);

    expect(res.body.message).toContain('Email already exists');
  });

  // 3. Table creation and listing
  it('should create and list tables', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/merchants/tables')
      .send({ code: 'T99' })
      .set('Authorization', `Bearer test-token`)
      .expect(201);

    expect(createRes.body.code).toBe('T99');

    const listRes = await request(app.getHttpServer())
      .get('/merchants/tables')
      .set('Authorization', `Bearer test-token`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((t: any) => t.code === 'T99')).toBe(true);
  });

  it('should fail to create table with duplicate code', async () => {
    await tableRepo.save({ code: 'T100' });

    const res = await request(app.getHttpServer())
      .post('/merchants/tables')
      .send({ code: 'T100' })
      .set('Authorization', `Bearer test-token`)
      .expect(400);

    expect(res.body.message).toContain('Table already exists');
  });
});