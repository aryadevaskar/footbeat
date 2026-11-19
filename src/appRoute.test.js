import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAppRoute } from './appRoute.js';

test('uses permanent bench URL in public routes and configured bench only for local development root', () => {
  assert.deepEqual(resolveAppRoute('/bench/newcastle-bench-002', false), { type: 'bench', benchId: 'newcastle-bench-002' });
  assert.deepEqual(resolveAppRoute('/', true, 'newcastle-bench-003'), { type: 'bench', benchId: 'newcastle-bench-003' });
  assert.deepEqual(resolveAppRoute('/', false), { type: 'scan-required' });
});

test('developer audio tools are unavailable on production routes', () => {
  assert.deepEqual(resolveAppRoute('/dev', true), { type: 'developer-tools' });
  assert.deepEqual(resolveAppRoute('/dev', false), { type: 'not-found' });
  assert.deepEqual(resolveAppRoute('/dev/qr-codes', true), { type: 'qr-tools' });
  assert.deepEqual(resolveAppRoute('/dev/qr-codes', false), { type: 'not-found' });
});
