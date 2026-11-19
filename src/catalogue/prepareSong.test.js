import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPreparedSongAssets, loadPreparedBeatmap } from './prepareSong.js';

const song = { duration: 120, audioAssetPath: '/audio/indie/track.mp3', beatmapRef: '/beatmaps/track.json' };

test('reports missing static audio and beatmap assets without throwing browser fetch errors', async () => {
  await assert.rejects(() => checkPreparedSongAssets(song, async () => ({ ok: false })), /audio file.*missing/i);
  let calls = 0;
  await assert.rejects(() => checkPreparedSongAssets(song, async () => ({ ok: ++calls === 1 })), /beatmap.*missing/i);
});

test('loads and validates prepared beatmap JSON against the selected song', async () => {
  const body = {
    version: 1, difficulty: 'easy', duration: 120, estimatedBpm: 100,
    beatCount: 4, beatTimes: [0, 0.6, 1.2, 1.8],
    steps: [{ id: 'step-1', timestamp: 0.6, beatIndex: 1, targetZone: 'left-front' }],
  };
  const result = await loadPreparedBeatmap(song, async () => ({ ok: true, json: async () => body }));
  assert.equal(result, body);
  await assert.rejects(() => loadPreparedBeatmap(song, async () => ({ ok: false })), /could not be found/i);
  await assert.rejects(() => loadPreparedBeatmap(song, async () => ({ ok: true, json: async () => ({}) })), /incomplete/i);
});

test('rejects generated choreography timestamps that do not match detected beats', async () => {
  const beatmap = {
    version: 1, difficulty: 'easy', duration: 120, estimatedBpm: 100,
    beatCount: 2, beatTimes: [0, 0.6],
    steps: [{ id: 'step-1', timestamp: 0.5, beatIndex: 1, targetZone: 'left-front' }],
  };
  await assert.rejects(() => loadPreparedBeatmap(song, async () => ({ ok: true, json: async () => beatmap })), /must reference.*detected beats/i);
});

test('rejects multiple movements assigned to one detected beat', async () => {
  const beatmap = {
    version: 1, difficulty: 'easy', duration: 120, estimatedBpm: 100,
    beatCount: 2, beatTimes: [0, 0.6],
    steps: [
      { id: 'step-1', timestamp: 0.6, beatIndex: 1, targetZone: 'left-front' },
      { id: 'step-2', timestamp: 0.6, beatIndex: 1, targetZone: 'right-front' },
    ],
  };
  await assert.rejects(() => loadPreparedBeatmap(song, async () => ({ ok: true, json: async () => beatmap })), /must reference.*detected beats/i);
});
