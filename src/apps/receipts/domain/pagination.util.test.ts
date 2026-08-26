import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTake, parseSkip } from './pagination.util.js';

test('parseTake: 유효한 숫자면 그대로 사용한다', () => {
  assert.equal(parseTake('20'), 20);
});

test('parseTake: 값이 없으면 기본값(10)을 사용한다', () => {
  assert.equal(parseTake(undefined), 10);
});

test('parseTake: 숫자가 아니면 기본값(10)을 사용한다', () => {
  assert.equal(parseTake('abc'), 10);
});

test('parseTake: 0 이하이면 기본값(10)을 사용한다', () => {
  assert.equal(parseTake('0'), 10);
  assert.equal(parseTake('-5'), 10);
});

test('parseTake: 최대값(50)을 넘으면 50으로 클램프한다', () => {
  assert.equal(parseTake('100'), 50);
});

test('parseSkip: 유효한 숫자면 그대로 사용한다', () => {
  assert.equal(parseSkip('5'), 5);
});

test('parseSkip: 값이 없으면 0을 사용한다', () => {
  assert.equal(parseSkip(undefined), 0);
});

test('parseSkip: 음수면 0을 사용한다', () => {
  assert.equal(parseSkip('-3'), 0);
});

test('parseSkip: 숫자가 아니면 0을 사용한다', () => {
  assert.equal(parseSkip('abc'), 0);
});
