import test from 'node:test';
import assert from 'node:assert/strict';
import { findActiveCueIndex } from './gameplayCue.js';

const steps = [
  { timestamp: 1.672 },
  { timestamp: 2.299 },
  { timestamp: 2.902 },
];

test('gameplay cue selection follows detected timestamps without a BPM-derived clock', () => {
  assert.equal(findActiveCueIndex(steps, 0), -1);
  assert.equal(findActiveCueIndex(steps, 1.671), -1);
  assert.equal(findActiveCueIndex(steps, 1.672), 0);
  assert.equal(findActiveCueIndex(steps, 2.8), 1);
  assert.equal(findActiveCueIndex(steps, 4), 2);
});
