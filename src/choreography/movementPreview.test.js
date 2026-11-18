import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceMovementPreview,
  createMovementPreviewState,
  getMovementStatuses,
  summarizeBeatmap,
} from './movementPreview.js';

const steps = [
  { id: 'one', timestamp: 1, targetZone: 'left-front', beatIndex: 0 },
  { id: 'two', timestamp: 2, targetZone: 'right-back', beatIndex: 1 },
  { id: 'three', timestamp: 3, targetZone: 'left-back', beatIndex: 2 },
];

function update(state, currentTime, reason, isPlaying = false, isEnded = false) {
  return advanceMovementPreview(state, steps, { currentTime, reason, isPlaying, isEnded });
}

test('preview clock shows upcoming, active and completed without recording misses during playback', () => {
  let state = update(createMovementPreviewState(), 0, 'sync');
  assert.deepEqual(getMovementStatuses(steps, state), { one: 'upcoming', two: 'upcoming', three: 'upcoming' });

  state = update(state, 0, 'play', true);
  state = update(state, 1.05, 'frame', true);
  assert.deepEqual(getMovementStatuses(steps, state), { one: 'active', two: 'upcoming', three: 'upcoming' });

  state = update(state, 2.1, 'frame', true);
  assert.deepEqual(getMovementStatuses(steps, state), { one: 'completed', two: 'active', three: 'upcoming' });
  assert.deepEqual([...state.skippedStepIds], []);
});

test('seeking forward marks only bypassed cues as skipped, with the landing cue active', () => {
  let state = update(createMovementPreviewState(), 0, 'sync');
  state = update(state, 0, 'play', true);
  state = update(state, 1.1, 'frame', true);
  state = update(state, 3, 'seeked', true);

  assert.deepEqual(getMovementStatuses(steps, state), { one: 'completed', two: 'missed', three: 'active' });
});

test('pausing preserves the active cue and rewinding clears later states for replay', () => {
  let state = update(createMovementPreviewState(), 0, 'sync');
  state = update(state, 0, 'play', true);
  state = update(state, 2.2, 'frame', true);
  state = update(state, 2.2, 'pause');
  assert.equal(getMovementStatuses(steps, state).two, 'active');

  state = update(state, 1.5, 'seeked');
  assert.deepEqual(getMovementStatuses(steps, state), { one: 'active', two: 'upcoming', three: 'upcoming' });
});

test('ending marks remaining cues complete but keeps explicit seek skips distinct', () => {
  let state = update(createMovementPreviewState(), 0, 'sync');
  state = update(state, 0, 'play', true);
  state = update(state, 1.1, 'frame', true);
  state = update(state, 2.8, 'seeked', true);
  state = update(state, 4, 'ended', false, true);
  assert.deepEqual(getMovementStatuses(steps, state), { one: 'completed', two: 'missed', three: 'completed' });
});

test('beatmap summary counts zones and averages actual movement gaps', () => {
  assert.deepEqual(summarizeBeatmap({ beatCount: 5, steps }), {
    detectedBeatCount: 5,
    movementCount: 3,
    openBeatCount: 2,
    leftFootCount: 2,
    rightFootCount: 1,
    frontPadCount: 1,
    rearPadCount: 2,
    averageMovementInterval: 1,
  });
  assert.equal(summarizeBeatmap({ beatCount: 0, steps: [] }).averageMovementInterval, null);
});
