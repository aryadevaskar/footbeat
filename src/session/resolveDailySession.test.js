import test from 'node:test';
import assert from 'node:assert/strict';
import { benches } from '../benches/benchConfig.js';
import { resolveDailySession, BenchConfigurationError, BenchNotFoundError } from './resolveDailySession.js';
import { loadDailySession } from './loadDailySession.js';

const audio = '/audio/indie/cleared-track.mp3';
const beatmap = '/beatmaps/cleared-track.json';
const catalogue = [
  { id: 'indie-ok', title: 'Cleared Track', artist: 'Artist', genre: 'indie', duration: 120, audioAssetPath: audio, beatmapRef: beatmap, availability: 'available' },
  { id: 'pop-ok', title: 'Other Genre', artist: 'Artist', genre: 'pop', duration: 90, audioAssetPath: '/audio/pop/track.mp3', beatmapRef: '/beatmaps/pop.json', availability: 'available' },
  { id: 'indie-hidden', title: 'Unavailable', artist: 'Artist', genre: 'indie', duration: 60, audioAssetPath: '/audio/indie/hidden.mp3', beatmapRef: '/beatmaps/hidden.json', availability: 'unavailable' },
];

test('resolves the configured daily schedule and filters to available tracks in that genre', () => {
  const monday = new Date('2025-06-02T12:00:00Z');
  const session = resolveDailySession({ benchId: benches[0].id, currentDate: monday, catalogue });
  assert.equal(session.genre, 'indie');
  assert.equal(session.weekday, 'monday');
  assert.deepEqual(session.songs.map(({ id }) => id), ['indie-ok']);
  assert.equal(session.unavailableSongs[0].id, 'indie-hidden');
});

test('different weekdays and bench configurations resolve independently', () => {
  const monday = new Date('2025-06-02T12:00:00Z');
  const tuesday = new Date('2025-06-03T12:00:00Z');
  assert.equal(resolveDailySession({ benchId: benches[0].id, currentDate: monday }).genre, 'indie');
  assert.equal(resolveDailySession({ benchId: benches[0].id, currentDate: tuesday }).genre, 'electronic');
  assert.equal(resolveDailySession({ benchId: benches[1].id, currentDate: monday }).genre, 'electronic');
});

test('all seven configured weekdays have an assigned genre', () => {
  const dates = [
    ['2025-06-01T12:00:00Z', 'sunday', 'pop'],
    ['2025-06-02T12:00:00Z', 'monday', 'indie'],
    ['2025-06-03T12:00:00Z', 'tuesday', 'electronic'],
    ['2025-06-04T12:00:00Z', 'wednesday', 'hip-hop'],
    ['2025-06-05T12:00:00Z', 'thursday', 'pop'],
    ['2025-06-06T12:00:00Z', 'friday', 'indie'],
    ['2025-06-07T12:00:00Z', 'saturday', 'electronic'],
  ];
  for (const [date, weekday, genre] of dates) {
    const session = resolveDailySession({ benchId: benches[0].id, currentDate: new Date(date) });
    assert.equal(session.weekday, weekday);
    assert.equal(session.genre, genre);
  }
});

test('uses the bench timezone to determine weekday and local date', () => {
  const beforeMidnightUtc = new Date('2025-06-02T23:30:00Z');
  const session = resolveDailySession({ benchId: benches[0].id, currentDate: beforeMidnightUtc });
  assert.equal(session.localDate, '2025-06-03');
  assert.equal(session.weekday, 'tuesday');
  assert.equal(session.genre, 'electronic');
});

test('daily genre changes at midnight in the bench timezone, not at UTC midnight', () => {
  const beforeLocalMidnight = resolveDailySession({
    benchId: benches[0].id,
    currentDate: new Date('2025-06-02T22:59:59Z'),
  });
  const atLocalMidnight = resolveDailySession({
    benchId: benches[0].id,
    currentDate: new Date('2025-06-02T23:00:00Z'),
  });
  assert.equal(beforeLocalMidnight.localDate, '2025-06-02');
  assert.equal(beforeLocalMidnight.genre, 'indie');
  assert.equal(atLocalMidnight.localDate, '2025-06-03');
  assert.equal(atLocalMidnight.genre, 'electronic');
});

test('daylight-saving transition preserves the local Sunday schedule', () => {
  const beforeClockChange = resolveDailySession({
    benchId: benches[0].id,
    currentDate: new Date('2025-03-30T00:59:59Z'),
  });
  const afterClockChange = resolveDailySession({
    benchId: benches[0].id,
    currentDate: new Date('2025-03-30T01:00:00Z'),
  });
  assert.equal(beforeClockChange.weekday, 'sunday');
  assert.equal(afterClockChange.weekday, 'sunday');
  assert.equal(beforeClockChange.genre, 'pop');
  assert.equal(afterClockChange.genre, 'pop');
});

test('unknown benches produce a useful typed error', () => {
  assert.throws(() => resolveDailySession({ benchId: 'not-a-bench' }), BenchNotFoundError);
});

test('an invalid bench timezone produces a useful configuration error', () => {
  const invalidTimezoneBench = { ...benches[0], timezone: 'Moon/Base' };
  assert.throws(() => resolveDailySession({
    benchId: invalidTimezoneBench.id,
    configuredBenches: [invalidTimezoneBench],
  }), /invalid timezone/i);
});

test('missing or partially invalid bench configuration fails before schedule resolution', () => {
  assert.throws(() => resolveDailySession({ benchId: benches[0].id, configuredBenches: null }), BenchConfigurationError);
  const partialSchedule = { ...benches[0], genreSchedule: { ...benches[0].genreSchedule, sunday: undefined } };
  assert.throws(() => resolveDailySession({ benchId: partialSchedule.id, configuredBenches: [partialSchedule] }), /sunday/i);
  assert.throws(() => resolveDailySession({
    benchId: benches[0].id,
    configuredBenches: [benches[0], { ...benches[0] }],
  }), /unique/i);
});

test('invalid dates are not misreported as timezone configuration errors', () => {
  assert.throws(() => resolveDailySession({
    benchId: benches[0].id,
    currentDate: new Date(Number.NaN),
  }), /session date must be a valid date/i);
});

test('missing audio and beatmap files are reported as unavailable', () => {
  const session = resolveDailySession({
    benchId: benches[0].id,
    currentDate: new Date('2025-06-02T12:00:00Z'),
    catalogue,
    assetPaths: new Set([audio]),
  });
  assert.deepEqual(session.songs, []);
  assert.equal(session.unavailableSongs.find(({ id }) => id === 'indie-ok').unavailableReason, 'prepared beatmap is missing');
});

test('catalogue entries missing playable metadata never appear as available songs', () => {
  const session = resolveDailySession({
    benchId: benches[0].id,
    currentDate: new Date('2025-06-02T12:00:00Z'),
    catalogue: [{ genre: 'indie', availability: 'available', audioAssetPath: audio, beatmapRef: beatmap }],
  });
  assert.equal(session.songs.length, 0);
  assert.equal(session.unavailableSongs[0].unavailableReason, 'song metadata is incomplete');
});

test('empty catalogues and genres without tracks are valid deterministic results', () => {
  const input = { benchId: benches[0].id, currentDate: new Date('2025-06-02T12:00:00Z'), catalogue: [] };
  assert.deepEqual(resolveDailySession(input).songs, []);
  assert.deepEqual(resolveDailySession(input), resolveDailySession(input));
});

test('async session loading removes catalogue entries with missing static assets', async () => {
  let requestCount = 0;
  const session = await loadDailySession({
    benchId: benches[0].id,
    currentDate: new Date('2025-06-02T12:00:00Z'),
    catalogue: [catalogue[0]],
  }, async () => ({ ok: ++requestCount === 1 }));
  assert.equal(session.songs.length, 0);
  assert.equal(session.unavailableSongs[0].unavailableReason, 'prepared beatmap is missing');
  assert.equal(requestCount, 2);
});
