import { zones } from '../data/zones.js';

const requiredBeatmapFields = ['version', 'difficulty', 'duration', 'estimatedBpm', 'beatCount', 'beatTimes', 'steps'];
const validZoneIds = new Set(zones.map(({ id }) => id));

export function validatePreparedBeatmap(beatmap, song) {
  if (!beatmap || requiredBeatmapFields.some((field) => !(field in beatmap))) {
    throw new Error('This song’s prepared beatmap is incomplete. Ask a FOOTBEAT administrator to check it.');
  }
  if (!Array.isArray(beatmap.steps) || !Array.isArray(beatmap.beatTimes)
    || !Number.isFinite(beatmap.duration) || beatmap.duration <= 0
    || beatmap.beatCount !== beatmap.beatTimes.length
    || (beatmap.estimatedBpm != null && (!Number.isFinite(beatmap.estimatedBpm) || beatmap.estimatedBpm <= 0))) {
    throw new Error('This song’s prepared beatmap is invalid. Ask a FOOTBEAT administrator to check it.');
  }
  if (beatmap.beatTimes.some((time, index) => !Number.isFinite(time) || time < 0 || time > beatmap.duration
    || (index > 0 && time <= beatmap.beatTimes[index - 1]))) {
    throw new Error('This song’s beat timestamps are invalid. Ask a FOOTBEAT administrator to check it.');
  }
  const stepIds = new Set();
  const assignedBeats = new Set();
  for (const step of beatmap.steps) {
    if (!step.id || stepIds.has(step.id) || !Number.isInteger(step.beatIndex)
      || step.beatIndex < 0 || step.beatIndex >= beatmap.beatTimes.length
      || assignedBeats.has(step.beatIndex)
      || !validZoneIds.has(step.targetZone) || !Number.isFinite(step.timestamp)
      || step.timestamp < 0 || step.timestamp > beatmap.duration
      || Math.abs(step.timestamp - (beatmap.beatTimes[step.beatIndex] ?? Number.NaN)) > 0.0001) {
      throw new Error('This song’s choreography must reference unique, detected beats and valid pressure zones.');
    }
    stepIds.add(step.id);
    assignedBeats.add(step.beatIndex);
  }
  if (song.duration && Math.abs(beatmap.duration - song.duration) > 1) {
    throw new Error('The beatmap duration does not match this audio file. The song is temporarily unavailable.');
  }
  return beatmap;
}

export async function checkAsset(url, fetcher = fetch) {
  if (!url) return false;
  try {
    const response = await fetcher(url, { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function loadPreparedBeatmap(song, fetcher = fetch) {
  if (!song?.beatmapRef) throw new Error('This song does not have a prepared beatmap yet.');
  const response = await fetcher(song.beatmapRef, { cache: 'no-store' });
  if (!response.ok) throw new Error('The prepared beatmap could not be found. This song is temporarily unavailable.');
  let beatmap;
  try {
    beatmap = await response.json();
  } catch {
    throw new Error('The prepared beatmap file is unreadable. This song is temporarily unavailable.');
  }
  return validatePreparedBeatmap(beatmap, song);
}

export async function checkPreparedSongAssets(song, fetcher = fetch) {
  const [hasAudio, hasBeatmap] = await Promise.all([
    checkAsset(song?.audioAssetPath, fetcher),
    checkAsset(song?.beatmapRef, fetcher),
  ]);
  if (!hasAudio) throw new Error('The audio file for this song is missing. This song is temporarily unavailable.');
  if (!hasBeatmap) throw new Error('The prepared beatmap for this song is missing. This song is temporarily unavailable.');
  return true;
}
