import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../libraries/db.js';

beforeEach(async () => {
  await prisma.receipt.deleteMany();
});

test('POST /receipts: 요청 바디의 category를 그대로 저장한다', async () => {
  const res = await request(app)
    .post('/receipts')
    .send({
      merchant: '스타벅스 강남점',
      amount: 12400,
      category: 'food',
      rawText: '아메리카노 4500',
      date: '2026-08-20',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.category, 'food');
  assert.equal(res.body.merchant, '스타벅스 강남점');
});

test('GET /receipts: 생성한 영수증이 목록에 포함된다', async () => {
  await request(app)
    .post('/receipts')
    .send({ merchant: 'A', amount: 1000, category: 'etc', date: '2026-08-01' });

  const res = await request(app).get('/receipts');

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].merchant, 'A');
});

test('GET /receipts/:id: 존재하는 영수증을 조회한다', async () => {
  const created = await request(app)
    .post('/receipts')
    .send({ merchant: 'B', amount: 2000, category: 'shop', date: '2026-08-02' });

  const res = await request(app).get(`/receipts/${created.body.id}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.merchant, 'B');
});

test('GET /receipts/:id: 존재하지 않으면 404를 반환한다', async () => {
  const res = await request(app).get('/receipts/999999');
  assert.equal(res.status, 404);
});

test('PATCH /receipts/:id: 일부 필드만 수정한다', async () => {
  const created = await request(app)
    .post('/receipts')
    .send({ merchant: 'C', amount: 3000, category: 'food', date: '2026-08-03' });

  const res = await request(app).patch(`/receipts/${created.body.id}`).send({ amount: 5000 });

  assert.equal(res.status, 200);
  assert.equal(res.body.amount, 5000);
  assert.equal(res.body.merchant, 'C');
});

test('DELETE /receipts/:id: 삭제 후 조회하면 404다', async () => {
  const created = await request(app)
    .post('/receipts')
    .send({ merchant: 'D', amount: 4000, category: 'etc', date: '2026-08-04' });

  const delRes = await request(app).delete(`/receipts/${created.body.id}`);
  assert.equal(delRes.status, 204);

  const getRes = await request(app).get(`/receipts/${created.body.id}`);
  assert.equal(getRes.status, 404);
});

test('GET /receipts/summary: 이번 달 영수증만 집계한다', async () => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const thisMonthDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-10`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthDate = `${prevMonth.getFullYear()}-${pad(prevMonth.getMonth() + 1)}-10`;

  await request(app)
    .post('/receipts')
    .send({ merchant: 'ThisMonth', amount: 10000, category: 'food', date: thisMonthDate });
  await request(app)
    .post('/receipts')
    .send({ merchant: 'LastMonth', amount: 5000, category: 'food', date: lastMonthDate });

  const res = await request(app).get('/receipts/summary');

  assert.equal(res.status, 200);
  assert.equal(res.body.total, 10000);
});
