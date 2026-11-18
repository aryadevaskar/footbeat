import test from 'node:test';
import assert from 'node:assert/strict';
import { getBeatIntervalRows, getBeatIntervalSummary } from './beatDiagnostics.js';

test('raw beat rows report actual adjacent timestamp intervals', () => {
  const rows = getBeatIntervalRows([0.12, 0.62, 1.37]);
  assert.deepEqual(rows.map(({ beatNumber, timestamp }) => ({ beatNumber, timestamp })), [
    { beatNumber: 1, timestamp: 0.12 },
    { beatNumber: 2, timestamp: 0.62 },
    { beatNumber: 3, timestamp: 1.37 },
  ]);
  assert.equal(rows[0].interval, null);
  assert.ok(Math.abs(rows[1].interval - 0.5) < 1e-12);
  assert.ok(Math.abs(rows[2].interval - 0.75) < 1e-12);
});

test('interval summary describes irregular timestamps without smoothing them', () => {
  const summary = getBeatIntervalSummary([1, 1.5, 2.25, 3.5]);
  assert.equal(summary.count, 3);
  assert.equal(summary.median, 0.75);
  assert.equal(summary.mean, 5 / 6);
  assert.ok(summary.coefficientOfVariation > 0);
});

test('empty and single-beat tracks have no interval summary', () => {
  assert.equal(getBeatIntervalSummary([]).median, null);
  assert.equal(getBeatIntervalSummary([0.7]).count, 0);
});
