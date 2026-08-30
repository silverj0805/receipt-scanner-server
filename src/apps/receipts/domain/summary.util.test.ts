import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSummary, getMonthRanges } from './summary.util.js';

test('buildSummary: 이번 달 합계를 계산한다', () => {
  const result = buildSummary(
    [
      { amount: 10000, category: 'food' },
      { amount: 5000, category: 'transit' },
    ],
    [],
  );
  assert.equal(result.total, 15000);
});

test('buildSummary: 지난달 합계가 0이면 deltaPercent는 0, deltaAmount는 이번달 합계 그대로다', () => {
  const result = buildSummary([{ amount: 10000, category: 'food' }], []);
  assert.equal(result.deltaPercent, 0);
  assert.equal(result.deltaAmount, 10000);
});

test('buildSummary: 전월 대비 증가율/증가액을 계산한다', () => {
  const result = buildSummary(
    [{ amount: 12000, category: 'food' }],
    [{ amount: 10000, category: 'food' }],
  );
  assert.equal(result.deltaPercent, 20);
  assert.equal(result.deltaAmount, 2000);
});

test('buildSummary: 전월 대비 감소율/감소액도 계산한다', () => {
  const result = buildSummary(
    [{ amount: 8000, category: 'food' }],
    [{ amount: 10000, category: 'food' }],
  );
  assert.equal(result.deltaPercent, -20);
  assert.equal(result.deltaAmount, -2000);
});

test('buildSummary: 카테고리별 합계와 비율을 계산한다', () => {
  const result = buildSummary(
    [
      { amount: 6000, category: 'food' },
      { amount: 4000, category: 'transit' },
    ],
    [],
  );
  const byCategory = [...result.byCategory].sort((a, b) => a.category.localeCompare(b.category));
  assert.deepEqual(byCategory, [
    { category: 'food', amount: 6000, percent: 60 },
    { category: 'transit', amount: 4000, percent: 40 },
  ]);
});

test('buildSummary: 같은 카테고리 항목은 합산된다', () => {
  const result = buildSummary(
    [
      { amount: 3000, category: 'food' },
      { amount: 2000, category: 'food' },
    ],
    [],
  );
  assert.deepEqual(result.byCategory, [{ category: 'food', amount: 5000, percent: 100 }]);
});

test('buildSummary: 이번 달 데이터가 없으면 total 0, byCategory 빈 배열', () => {
  const result = buildSummary([], []);
  assert.equal(result.total, 0);
  assert.deepEqual(result.byCategory, []);
});

test('getMonthRanges: 기준 날짜로 이번 달/다음 달/지난 달 시작일을 계산한다', () => {
  const now = new Date(2026, 7, 20); // 2026-08-20 (month는 0-indexed)
  const ranges = getMonthRanges(now);
  assert.deepEqual(ranges.startOfThisMonth, new Date(2026, 7, 1));
  assert.deepEqual(ranges.startOfNextMonth, new Date(2026, 8, 1));
  assert.deepEqual(ranges.startOfLastMonth, new Date(2026, 6, 1));
});

test('getMonthRanges: 1월 기준이면 지난 달은 작년 12월이다', () => {
  const now = new Date(2026, 0, 15); // 2026-01-15
  const ranges = getMonthRanges(now);
  assert.deepEqual(ranges.startOfLastMonth, new Date(2025, 11, 1));
});
