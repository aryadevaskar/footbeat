import test from 'node:test';
import assert from 'node:assert/strict';
import { createBenchUrl, parseBenchRoute } from './benchRoute.js';
import { resolveAppRoute } from '../appRoute.js';

test('identifies a configured bench route and supports a trailing slash', () => {
  assert.equal(parseBenchRoute('/bench/newcastle-bench-001'), 'newcastle-bench-001');
  assert.equal(parseBenchRoute('/bench/newcastle-bench-002/'), 'newcastle-bench-002');
});

test('does not treat unrelated paths or malformed ids as bench routes', () => {
  assert.equal(parseBenchRoute('/'), null);
  assert.equal(parseBenchRoute('/bench/unknown/id'), null);
  assert.equal(parseBenchRoute('/bench/%2F'), null);
});

test('normalizes case-insensitive bench URLs to configured lowercase IDs', () => {
  assert.equal(parseBenchRoute('/bench/Newcastle-Bench-001'), 'newcastle-bench-001');
  assert.deepEqual(resolveAppRoute('/bench/Newcastle-Bench-001', false), {
    type: 'bench', benchId: 'newcastle-bench-001',
  });
});

test('QR URL creation rejects invalid IDs and non-web URL schemes', () => {
  assert.throws(() => createBenchUrl('../bench', 'https://example.test'), /lowercase letters/i);
  assert.throws(() => createBenchUrl('bench-1', 'javascript:alert(1)'), /HTTP or HTTPS/i);
});
