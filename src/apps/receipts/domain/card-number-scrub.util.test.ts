import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrubCardNumbers } from './card-number-scrub.util.js';

test('구분자 없는 16자리 카드번호를 가린다', () => {
  const result = scrubCardNumbers('카드결제 5300123412345678 승인');
  assert.equal(result, '카드결제 [카드번호 마스킹됨] 승인');
});

test('4-4-4-4 대시 구분 + 별표 마스킹된 카드번호를 가린다', () => {
  const result = scrubCardNumbers('신한카드 5300-12**-****-6789 일시불');
  assert.equal(result, '신한카드 [카드번호 마스킹됨] 일시불');
});

test('OCR이 마스킹 문자를 다른 글자로 잘못 읽은 경우도 숫자 비중이 높으면 가린다', () => {
  const result = scrubCardNumbers('53275075*x^ 승인번호 00012345');
  assert.equal(result.includes('[카드번호 마스킹됨]'), true);
});

test('짧은 숫자(금액, 날짜)는 가리지 않는다', () => {
  const result = scrubCardNumbers('아메리카노 4500원 2026-08-20');
  assert.equal(result, '아메리카노 4500원 2026-08-20');
});

test('일반 텍스트(가맹점명 등)는 그대로 둔다', () => {
  const result = scrubCardNumbers('스타벅스 강남점\n아메리카노 4500\n합계 4500원');
  assert.equal(result, '스타벅스 강남점\n아메리카노 4500\n합계 4500원');
});

test('여러 줄바꿈/공백을 그대로 보존한다', () => {
  const result = scrubCardNumbers('줄1\n\n줄2   줄3');
  assert.equal(result, '줄1\n\n줄2   줄3');
});
