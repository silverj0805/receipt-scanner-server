import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '@/app.js';
import { prisma } from '@/libraries/db.js';

const DEVICE_A = 'device-a';
const DEVICE_B = 'device-b';

beforeEach(async () => {
  await prisma.receipt.deleteMany();
});

test('X-Device-Id 헤더가 없으면 400을 반환한다', async () => {
  const res = await request(app).get('/receipts');
  assert.equal(res.status, 400);
});

test('POST /receipts: category가 유효하지 않으면 400을 반환한다', async () => {
  const res = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: 1000, category: 'not-a-category', date: '2026-08-20' });

  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
});

test('POST /receipts: amount가 음수면 400을 반환한다', async () => {
  const res = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: -100, category: 'food', date: '2026-08-20' });

  assert.equal(res.status, 400);
});

test('POST /receipts: itemName 없이도 생성된다 (선택 입력)', async () => {
  const res = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: 1000, category: 'food', date: '2026-08-20' });

  assert.equal(res.status, 201);
  assert.equal(res.body.itemName, null);
});

test('POST /receipts: itemName을 보내면 저장된다', async () => {
  const res = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: '스타벅스', itemName: '아메리카노', amount: 4500, category: 'food', date: '2026-08-20' });

  assert.equal(res.status, 201);
  assert.equal(res.body.itemName, '아메리카노');
});

test('PATCH /receipts/:id: itemName만 수정한다', async () => {
  const created = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: 1000, category: 'food', date: '2026-08-20' });

  const res = await request(app)
    .patch(`/receipts/${created.body.id}`)
    .set('X-Device-Id', DEVICE_A)
    .send({ itemName: '샴푸' });

  assert.equal(res.status, 200);
  assert.equal(res.body.itemName, '샴푸');
  assert.equal(res.body.amount, 1000);
});

test('PATCH /receipts/:id: amount가 음수면 400을 반환한다', async () => {
  const created = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: 1000, category: 'food', date: '2026-08-20' });

  const res = await request(app)
    .patch(`/receipts/${created.body.id}`)
    .set('X-Device-Id', DEVICE_A)
    .send({ amount: -1 });

  assert.equal(res.status, 400);
});

test('POST /receipts: 요청 바디의 category를 그대로 저장한다', async () => {
  const res = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
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

test('POST /receipts: rawText에 카드번호가 있으면 저장 전에 마스킹한다', async () => {
  const res = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({
      merchant: '스타벅스 강남점',
      amount: 4500,
      category: 'food',
      rawText: '아메리카노 4500\n신한카드 5300-12**-****-6789 일시불',
      date: '2026-08-20',
    });

  assert.equal(res.status, 201);
  assert.match(res.body.rawText, /\[카드번호 마스킹됨\]/);
  assert.equal(res.body.rawText.includes('5300-12'), false);
});

test('GET /receipts: 생성한 영수증이 목록에 포함된다', async () => {
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: 1000, category: 'etc', date: '2026-08-01' });

  const res = await request(app).get('/receipts').set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].merchant, 'A');
});

test('GET /receipts: 목록에는 id/merchant/itemName/amount/date/category만 내려온다', async () => {
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', itemName: '아메리카노', amount: 1000, category: 'etc', date: '2026-08-01' });

  const res = await request(app).get('/receipts').set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.deepEqual(
    Object.keys(res.body[0]).sort(),
    ['amount', 'category', 'date', 'id', 'itemName', 'merchant'],
  );
});

test('GET /receipts: 같은 날짜인 영수증들은 최신 생성분(id가 큰 것)부터 나온다', async () => {
  const first = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: '먼저 생성', amount: 1000, category: 'etc', date: '2026-08-15' });
  const second = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: '나중 생성', amount: 2000, category: 'etc', date: '2026-08-15' });

  const res = await request(app).get('/receipts').set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.equal(res.body[0].id, second.body.id);
  assert.equal(res.body[1].id, first.body.id);
});

test('GET /receipts: 다른 deviceId의 영수증은 보이지 않는다', async () => {
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: 1000, category: 'etc', date: '2026-08-01' });

  const res = await request(app).get('/receipts').set('X-Device-Id', DEVICE_B);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 0);
});

test('GET /receipts/:id: 존재하는 영수증을 조회한다', async () => {
  const created = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'B', amount: 2000, category: 'shop', date: '2026-08-02' });

  const res = await request(app).get(`/receipts/${created.body.id}`).set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.equal(res.body.merchant, 'B');
});

test('GET /receipts/:id: 존재하지 않으면 404를 반환한다', async () => {
  const res = await request(app).get('/receipts/999999').set('X-Device-Id', DEVICE_A);
  assert.equal(res.status, 404);
});

test('GET /receipts/:id: 다른 deviceId가 만든 영수증은 404를 반환한다', async () => {
  const created = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'B', amount: 2000, category: 'shop', date: '2026-08-02' });

  const res = await request(app).get(`/receipts/${created.body.id}`).set('X-Device-Id', DEVICE_B);

  assert.equal(res.status, 404);
});

test('PATCH /receipts/:id: 일부 필드만 수정한다', async () => {
  const created = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'C', amount: 3000, category: 'food', date: '2026-08-03' });

  const res = await request(app)
    .patch(`/receipts/${created.body.id}`)
    .set('X-Device-Id', DEVICE_A)
    .send({ amount: 5000 });

  assert.equal(res.status, 200);
  assert.equal(res.body.amount, 5000);
  assert.equal(res.body.merchant, 'C');
});

test('PATCH /receipts/:id: 다른 deviceId가 만든 영수증은 수정할 수 없다', async () => {
  const created = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'C', amount: 3000, category: 'food', date: '2026-08-03' });

  const res = await request(app)
    .patch(`/receipts/${created.body.id}`)
    .set('X-Device-Id', DEVICE_B)
    .send({ amount: 5000 });

  assert.equal(res.status, 404);
});

test('DELETE /receipts/:id: 삭제 후 조회하면 404다', async () => {
  const created = await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'D', amount: 4000, category: 'etc', date: '2026-08-04' });

  const delRes = await request(app).delete(`/receipts/${created.body.id}`).set('X-Device-Id', DEVICE_A);
  assert.equal(delRes.status, 204);

  const getRes = await request(app).get(`/receipts/${created.body.id}`).set('X-Device-Id', DEVICE_A);
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
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'ThisMonth', amount: 10000, category: 'food', date: thisMonthDate });
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'LastMonth', amount: 5000, category: 'food', date: lastMonthDate });

  const res = await request(app).get('/receipts/summary').set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.equal(res.body.total, 10000);
});

test('GET /receipts?category=: 지정한 카테고리 하나만 반환한다', async () => {
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: 1000, category: 'food', date: '2025-01-10' });
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'B', amount: 2000, category: 'transit', date: '2025-01-11' });

  const res = await request(app).get('/receipts?category=food').set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].category, 'food');
});

test('GET /receipts?category=: 콤마로 여러 개 넘기면 해당 카테고리들만 반환한다', async () => {
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: 1000, category: 'food', date: '2025-01-10' });
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'B', amount: 2000, category: 'transit', date: '2025-01-11' });
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'C', amount: 3000, category: 'shop', date: '2025-01-12' });

  const res = await request(app).get('/receipts?category=food,transit').set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.deepEqual(
    res.body.map((r: { category: string }) => r.category).sort(),
    ['food', 'transit'],
  );
});

test('GET /receipts?category=: 6개(전체) 다 넘기면 필터 없는 것과 결과가 같다', async () => {
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'A', amount: 1000, category: 'food', date: '2025-01-10' });
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'B', amount: 2000, category: 'etc', date: '2025-01-11' });

  const res = await request(app)
    .get('/receipts?category=food,transit,shop,culture,health,etc')
    .set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 2);
});

test('GET /receipts?category=: 유효하지 않은 카테고리면 400을 반환한다', async () => {
  const res = await request(app).get('/receipts?category=food,invalid').set('X-Device-Id', DEVICE_A);
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
});

test('GET /receipts?month=: 해당 월의 영수증만 반환한다', async () => {
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'Jan', amount: 1000, category: 'food', date: '2025-01-15' });
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'Feb', amount: 2000, category: 'food', date: '2025-02-15' });

  const res = await request(app).get('/receipts?month=2025-01').set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].merchant, 'Jan');
});

test('GET /receipts?month=: 형식이 잘못되면 400을 반환한다', async () => {
  const res = await request(app).get('/receipts?month=2025/01').set('X-Device-Id', DEVICE_A);
  assert.equal(res.status, 400);
});

test('GET /receipts?category=&month=: 두 필터를 함께 적용한다', async () => {
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'JanFood', amount: 1000, category: 'food', date: '2025-01-10' });
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'JanTransit', amount: 2000, category: 'transit', date: '2025-01-11' });
  await request(app)
    .post('/receipts')
    .set('X-Device-Id', DEVICE_A)
    .send({ merchant: 'FebFood', amount: 3000, category: 'food', date: '2025-02-10' });

  const res = await request(app)
    .get('/receipts?category=food&month=2025-01')
    .set('X-Device-Id', DEVICE_A);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].merchant, 'JanFood');
});
