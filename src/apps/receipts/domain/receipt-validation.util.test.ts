import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReceiptCreate, validateReceiptPatch } from './receipt-validation.util.js';

const VALID = { merchant: '스타벅스', amount: 5000, category: 'food', date: '2026-08-20' };

test('validateReceiptCreate: 유효한 입력이면 에러가 없다', () => {
  assert.deepEqual(validateReceiptCreate(VALID), []);
});

test('validateReceiptCreate: merchant가 빈 문자열이면 에러', () => {
  const errors = validateReceiptCreate({ ...VALID, merchant: '' });
  assert.ok(errors.some((e) => e.includes('merchant')));
});

test('validateReceiptCreate: amount가 0 이하면 에러', () => {
  const errors = validateReceiptCreate({ ...VALID, amount: 0 });
  assert.ok(errors.some((e) => e.includes('amount')));
});

test('validateReceiptCreate: amount가 숫자가 아니면 에러', () => {
  const errors = validateReceiptCreate({ ...VALID, amount: '5000' });
  assert.ok(errors.some((e) => e.includes('amount')));
});

test('validateReceiptCreate: category가 6개 값 중 하나가 아니면 에러', () => {
  const errors = validateReceiptCreate({ ...VALID, category: 'invalid' });
  assert.ok(errors.some((e) => e.includes('category')));
});

test('validateReceiptCreate: date가 유효하지 않으면 에러', () => {
  const errors = validateReceiptCreate({ ...VALID, date: 'not-a-date' });
  assert.ok(errors.some((e) => e.includes('date')));
});

test('validateReceiptCreate: 바디가 객체가 아니면 에러', () => {
  const errors = validateReceiptCreate(null);
  assert.ok(errors.length > 0);
});

test('validateReceiptPatch: 빈 객체는 통과한다 (수정할 필드 없음)', () => {
  assert.deepEqual(validateReceiptPatch({}), []);
});

test('validateReceiptPatch: 제공된 필드만 검증한다', () => {
  const errors = validateReceiptPatch({ amount: -1 });
  assert.equal(errors.length, 1);
  assert.ok(errors[0]?.includes('amount'));
});
