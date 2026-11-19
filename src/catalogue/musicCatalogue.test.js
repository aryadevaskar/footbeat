import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { benches } from '../benches/benchConfig.js';
import { resolveDailySession } from '../session/resolveDailySession.js';
import { loadDailySession } from '../session/loadDailySession.js';
import { validatePreparedBeatmap } from './prepareSong.js';
import { musicCatalogue } from './musicCatalogue.js';

const danceMonkey = musicCatalogue.find((song) => song.id === 'dance-monkey');

test('Dance Monkey is registered as a playable Pop song with validated local assets', async () => {
  assert.ok(danceMonkey);
  assert.equal(danceMonkey.title, 'Dance Monkey');
  assert.equal(danceMonkey.artist, 'Tones and I');
  assert.equal(danceMonkey.genre, 'pop');
  assert.equal(danceMonkey.availability, 'available');

  const audioFile = resolve(process.cwd(), 'public', danceMonkey.audioAssetPath.slice(1));
  const beatmapFile = resolve(process.cwd(), 'public', danceMonkey.beatmapRef.slice(1));
  assert.equal(existsSync(audioFile), true);
  assert.equal(existsSync(beatmapFile), true);

  const beatmap = JSON.parse(readFileSync(beatmapFile, 'utf8'));
  validatePreparedBeatmap(beatmap, danceMonkey);
  assert.equal(beatmap.beatCount, 338);
  assert.equal(beatmap.beatTimes[0], 1.671837);
  assert.ok(beatmap.steps.length > 0);
});

test('a Pop-assigned public bench offers Dance Monkey only after both assets respond', async () => {
  const sessionDate = new Date('2026-11-19T12:00:00Z');
  const withoutAssets = resolveDailySession({
    benchId: benches[0].id,
    currentDate: sessionDate,
    assetPaths: new Set(),
  });
  assert.equal(withoutAssets.genre, 'pop');
  assert.deepEqual(withoutAssets.songs, []);

  const withAssets = await loadDailySession({ benchId: benches[0].id, currentDate: sessionDate }, async (url, options) => {
    assert.equal(options.method, 'HEAD');
    return { ok: url === danceMonkey.audioAssetPath || url === danceMonkey.beatmapRef };
  });
  assert.equal(withAssets.genre, 'pop');
  assert.deepEqual(withAssets.songs.map((song) => song.id), ['dance-monkey']);
});
