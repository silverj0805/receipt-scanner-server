import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldMountDebugRoutes } from './debug-env.util.js';

test('NODE_ENV가 production이면 false를 반환한다', () => {
  assert.equal(shouldMountDebugRoutes('production'), false);
});

test('NODE_ENV가 production이 아니면(개발/미설정) true를 반환한다', () => {
  assert.equal(shouldMountDebugRoutes('development'), true);
  assert.equal(shouldMountDebugRoutes('test'), true);
  assert.equal(shouldMountDebugRoutes(undefined), true);
});
