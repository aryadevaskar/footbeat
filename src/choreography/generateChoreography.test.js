import test from 'node:test';
import assert from 'node:assert/strict';
import { zones } from '../data/zones.js';
import { DIFFICULTY_RULES } from './difficultyRules.js';
import { generateChoreography } from './generateChoreography.js';

const duration = 24;
const beatTimes = Array.from({ length: 48 }, (_, index) => index * 0.5 + 0.12);
const validZoneIds = new Set(zones.map((zone) => zone.id));

test('generates useful beatmaps at all three difficulty levels', () => {
  const maps = ['easy', 'medium', 'hard'].map((difficulty) => (
    generateChoreography({ duration, estimatedBpm: 120, beatTimes, difficulty })
  ));

  for (const beatmap of maps) {
    assert.ok(beatmap.steps.length > 0);
    assert.equal(beatmap.movementCount, beatmap.steps.length);
    assert.equal(beatmap.restBeatCount, beatmap.beatCount - beatmap.steps.length);
    assert.ok(beatmap.steps.every((step) => step.difficulty === beatmap.difficulty));
  }
  assert.ok(maps[0].steps.length <= maps[1].steps.length);
  assert.ok(maps[1].steps.length <= maps[2].steps.length);
});

test('produces deterministic output for identical input and difficulty', () => {
  const input = { duration, estimatedBpm: 120, beatTimes, difficulty: 'medium' };
  assert.deepEqual(generateChoreography(input), generateChoreography(input));
});

test('uses only known zone IDs and exact detected timestamps', () => {
  const beatmap = generateChoreography({ duration, estimatedBpm: 120, beatTimes, difficulty: 'hard' });
  const detected = new Set(beatTimes);
  for (const step of beatmap.steps) {
    assert.ok(validZoneIds.has(step.targetZone));
    assert.ok(detected.has(step.timestamp));
    assert.ok(step.timestamp >= 0 && step.timestamp <= duration);
    assert.equal(step.timestamp, beatTimes[step.beatIndex]);
  }
});

test('uses all four zones on a sufficiently long track and keeps Easy front-led', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const beatmap = generateChoreography({ duration, estimatedBpm: 120, beatTimes, difficulty });
    assert.deepEqual(new Set(beatmap.steps.map((step) => step.targetZone)), validZoneIds);
    if (difficulty === 'easy') {
      assert.ok(beatmap.steps.slice(0, 2).every((step) => step.targetZone.endsWith('-front')));
    }
  }
});

test('assigns at most one movement to each beat and gives every step a unique ID', () => {
  const beatmap = generateChoreography({ duration, estimatedBpm: 120, beatTimes, difficulty: 'medium' });
  assert.equal(new Set(beatmap.steps.map((step) => step.beatIndex)).size, beatmap.steps.length);
  assert.equal(new Set(beatmap.steps.map((step) => step.timestamp)).size, beatmap.steps.length);
  assert.equal(new Set(beatmap.steps.map((step) => step.id)).size, beatmap.steps.length);
});

test('respects movement and same-foot depth-switch spacing', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const beatmap = generateChoreography({ duration, estimatedBpm: 120, beatTimes, difficulty });
    const rules = DIFFICULTY_RULES[difficulty];
    for (let index = 1; index < beatmap.steps.length; index += 1) {
      const previous = beatmap.steps[index - 1];
      const current = beatmap.steps[index];
      const elapsed = current.timestamp - previous.timestamp;
      const requiredGap = Math.max(rules.minimumStepGapSeconds, (60 / 120) * rules.minimumBeatIntervalFraction);
      assert.ok(elapsed >= requiredGap - Number.EPSILON);

      const previousZone = zones.find((zone) => zone.id === previous.targetZone);
      const currentZone = zones.find((zone) => zone.id === current.targetZone);
      if (previousZone.side === currentZone.side && previousZone.position !== currentZone.position) {
        assert.ok(elapsed >= rules.minimumSameFootDepthSwitchSeconds);
      }
    }
  }
});

test('avoids long repeated zone patterns', () => {
  const irregularLongTrack = Array.from({ length: 120 }, (_, index) => index * 0.35 + 0.04);
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const sequence = generateChoreography({
      duration: 45,
      estimatedBpm: 171.4,
      beatTimes: irregularLongTrack,
      difficulty,
    }).steps.map((step) => step.targetZone);

    for (let period = 2; period <= DIFFICULTY_RULES[difficulty].maximumPatternPeriod; period += 1) {
      for (let start = 0; start + period * 3 <= sequence.length; start += 1) {
        const first = sequence.slice(start, start + period);
        const second = sequence.slice(start + period, start + period * 2);
        const third = sequence.slice(start + period * 2, start + period * 3);
        assert.equal(first.join(',') === second.join(',') && second.join(',') === third.join(','), false);
      }
    }
  }
});

test('handles empty and invalid beat input without inventing timestamps', () => {
  const empty = generateChoreography({ duration: 8, beatTimes: [], difficulty: 'easy' });
  assert.deepEqual(empty.steps, []);
  assert.match(empty.warnings[0], /No valid detected beats/);

  const invalid = generateChoreography({
    duration: 8,
    beatTimes: [Number.NaN, -0.1, 8.1, '1.2', Number.POSITIVE_INFINITY],
    difficulty: 'easy',
  });
  assert.deepEqual(invalid.steps, []);
  assert.equal(invalid.beatCount, 0);
  assert.ok(invalid.warnings.some((warning) => /invalid beat timestamp/.test(warning)));
  assert.throws(() => generateChoreography({ duration: 8, beatTimes: null }), /beatTimes must be an array/);
  assert.throws(() => generateChoreography({ duration: 0, beatTimes: [] }), /duration must be/);
});

test('handles irregular beat intervals using only supplied beat positions', () => {
  const irregular = [0.07, 0.41, 0.93, 1.18, 1.77, 2.02, 2.81, 3.16, 3.8, 4.05, 4.87, 5.21];
  const beatmap = generateChoreography({ duration: 6, estimatedBpm: 130, beatTimes: irregular, difficulty: 'hard' });
  assert.ok(beatmap.steps.length > 0);
  assert.ok(beatmap.steps.every((step) => irregular.includes(step.timestamp)));
  assert.ok(beatmap.steps.every((step) => step.timestamp <= 6));
});

test('deduplicates simultaneous detected timestamps and reports the discarded duplicate', () => {
  const beatmap = generateChoreography({ duration: 5, beatTimes: [0.2, 0.7, 0.7, 1.2], difficulty: 'hard' });
  assert.equal(beatmap.beatCount, 3);
  assert.equal(new Set(beatmap.steps.map((step) => step.timestamp)).size, beatmap.steps.length);
  assert.ok(beatmap.warnings.some((warning) => /duplicate beat timestamp/.test(warning)));
});
