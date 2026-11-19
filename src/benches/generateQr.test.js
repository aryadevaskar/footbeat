import test from 'node:test';
import assert from 'node:assert/strict';
import { benches } from './benchConfig.js';
import { generateBenchQrSvg } from './generateQr.js';

test('generates local SVG QR codes for permanent unique bench URLs', async () => {
  const generated = await Promise.all(benches.slice(0, 2).map((bench) => generateBenchQrSvg(bench, 'https://footbeat.example')));
  assert.match(generated[0].url, /\/bench\/newcastle-bench-001$/);
  assert.match(generated[1].url, /\/bench\/newcastle-bench-002$/);
  assert.notEqual(generated[0].url, generated[1].url);
  assert.match(generated[0].svg, /<svg[\s>]/);
});
