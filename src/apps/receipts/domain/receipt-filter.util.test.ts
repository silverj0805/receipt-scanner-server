import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReceiptFilters } from './receipt-filter.util.js';

test('category, month 둘 다 생략하면 필터 없음(전체)', () => {
  const { filters, errors } = parseReceiptFilters({});
  assert.deepEqual(errors, []);
  assert.equal(filters.categories, undefined);
  assert.equal(filters.monthRange, undefined);
});

test('category 하나만 넘기면 그 값만 필터에 포함된다', () => {
  const { filters, errors } = parseReceiptFilters({ category: 'food' });
  assert.deepEqual(errors, []);
  assert.deepEqual(filters.categories, ['food']);
});

test('category를 콤마로 여러 개(최대 5개) 넘기면 전부 필터에 포함된다', () => {
  const { filters, errors } = parseReceiptFilters({ category: 'food,transit,shop,culture,health' });
  assert.deepEqual(errors, []);
  assert.deepEqual(filters.categories, ['food', 'transit', 'shop', 'culture', 'health']);
});

test('category 6개(전체) 넘겨도 에러 없이 6개 그대로 반환된다(필터링 결과는 전체와 동일)', () => {
  const { filters, errors } = parseReceiptFilters({ category: 'food,transit,shop,culture,health,etc' });
  assert.deepEqual(errors, []);
  assert.equal(filters.categories?.length, 6);
});

test('category에 유효하지 않은 값이 있으면 에러를 반환한다', () => {
  const { filters, errors } = parseReceiptFilters({ category: 'food,invalid' });
  assert.equal(filters.categories, undefined);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!, /invalid/);
});

test('category 중복값은 제거된다', () => {
  const { filters } = parseReceiptFilters({ category: 'food,food,transit' });
  assert.deepEqual(filters.categories, ['food', 'transit']);
});

test('month를 YYYY-MM으로 넘기면 해당 월의 범위로 파싱된다', () => {
  const { filters, errors } = parseReceiptFilters({ month: '2026-08' });
  assert.deepEqual(errors, []);
  assert.deepEqual(filters.monthRange, {
    start: new Date(2026, 7, 1),
    end: new Date(2026, 8, 1),
  });
});

test('month 형식이 잘못되면 에러를 반환한다', () => {
  const { filters, errors } = parseReceiptFilters({ month: '2026/08' });
  assert.equal(filters.monthRange, undefined);
  assert.equal(errors.length, 1);
});

test('month 값이 01~12 범위를 벗어나면 에러를 반환한다', () => {
  const { errors } = parseReceiptFilters({ month: '2026-13' });
  assert.equal(errors.length, 1);
});

test('category와 month 둘 다 잘못되면 에러 2개가 함께 반환된다', () => {
  const { errors } = parseReceiptFilters({ category: 'invalid', month: '2026-13' });
  assert.equal(errors.length, 2);
});
