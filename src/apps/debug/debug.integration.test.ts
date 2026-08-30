import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../libraries/db.js';

beforeEach(async () => {
  await prisma.receipt.deleteMany();
});

test('POST /debug/seed: deviceId 없이 요청하면 400을 반환한다', async () => {
  const res = await request(app).post('/debug/seed').send({});
  assert.equal(res.status, 400);
});

test('POST /debug/seed: 요청받은 deviceId로 더미 영수증 20개를 생성한다', async () => {
  const res = await request(app).post('/debug/seed').send({ deviceId: 'seed-test-device' });

  assert.equal(res.status, 201);
  assert.equal(res.body.created, 20);
  assert.equal(res.body.deviceId, 'seed-test-device');

  const list = await request(app).get('/receipts?take=50').set('X-Device-Id', 'seed-test-device');
  assert.equal(list.body.length, 20);

  const categories = new Set(list.body.map((r: { category: string }) => r.category));
  assert.equal(categories.size, 6, '6개 카테고리가 모두 포함되어야 함');
});

test('POST /debug/reset: deviceId와 무관하게 모든 영수증을 삭제한다', async () => {
  await request(app).post('/debug/seed').send({ deviceId: 'device-x' });
  await request(app).post('/debug/seed').send({ deviceId: 'device-y' });

  const resetRes = await request(app).post('/debug/reset');

  assert.equal(resetRes.status, 200);
  assert.equal(resetRes.body.deleted, 40);
  assert.equal(await prisma.receipt.count(), 0);
});
