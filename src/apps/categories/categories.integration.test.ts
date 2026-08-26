import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../app.js';

test('GET /categories: 6개 카테고리를 id/label/bg/color와 함께 반환한다', async () => {
  const res = await request(app).get('/categories');

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 6);

  const ids = res.body.map((c: { id: string }) => c.id).sort();
  assert.deepEqual(ids, ['culture', 'etc', 'food', 'health', 'shop', 'transit']);

  for (const category of res.body) {
    assert.ok(category.label);
    assert.ok(category.bg);
    assert.ok(category.color);
  }
});
