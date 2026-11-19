import { benches as defaultBenches } from '../benches/benchConfig.js';
import { musicCatalogue as defaultCatalogue } from '../catalogue/musicCatalogue.js';
import { genres } from '../catalogue/genres.js';

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const supportedGenres = new Set(Object.keys(genres));

export class BenchNotFoundError extends Error {
  constructor(benchId) {
    super(`No FOOTBEAT bench is configured for “${benchId}”. Check the QR code or ask a site host for help.`);
    this.name = 'BenchNotFoundError';
    this.benchId = benchId;
  }
}

export class BenchConfigurationError extends Error {
  constructor(benchId, reason) {
    super(`Bench “${benchId || 'unknown'}” has invalid configuration: ${reason}`);
    this.name = 'BenchConfigurationError';
    this.benchId = benchId;
  }
}

export function getBenchLocalDate(date, timezone) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new RangeError('The session date must be a valid Date.');
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday.toLowerCase(),
  };
}

function checkSong(song, genre, assetPaths) {
  if (song.genre !== genre) return null;
  if (song.availability !== 'available') return { song, reason: 'not marked available' };
  if (!song.id || !song.title || !song.artist) return { song, reason: 'song metadata is incomplete' };
  if (!Number.isFinite(song.duration) || song.duration <= 0) return { song, reason: 'song duration is missing' };
  if (!song.audioAssetPath) return { song, reason: 'audio reference is missing' };
  if (!song.beatmapRef) return { song, reason: 'prepared beatmap reference is missing' };
  if (assetPaths && !assetPaths.has(song.audioAssetPath)) return { song, reason: 'audio file is missing' };
  if (assetPaths && !assetPaths.has(song.beatmapRef)) return { song, reason: 'prepared beatmap is missing' };
  return { song };
}

export function resolveDailySession({
  benchId,
  currentDate = new Date(),
  configuredBenches = defaultBenches,
  catalogue = defaultCatalogue,
  assetPaths,
} = {}) {
  if (!Array.isArray(configuredBenches)) {
    throw new BenchConfigurationError(benchId, 'the bench configuration list is missing.');
  }
  const matchingBenches = configuredBenches.filter((item) => item?.id === benchId);
  if (matchingBenches.length === 0) throw new BenchNotFoundError(benchId ?? '');
  if (matchingBenches.length > 1) {
    throw new BenchConfigurationError(benchId, 'bench IDs must be unique.');
  }
  const bench = matchingBenches[0];
  if (typeof bench.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(bench.id)
    || typeof bench.name !== 'string' || !bench.name.trim()
    || typeof bench.location !== 'string' || !bench.location.trim()
    || typeof bench.timezone !== 'string' || !bench.timezone.trim()) {
    throw new BenchConfigurationError(benchId, 'id, name, location, and timezone are required.');
  }
  if (!bench.genreSchedule || typeof bench.genreSchedule !== 'object' || Array.isArray(bench.genreSchedule)) {
    throw new BenchConfigurationError(benchId, 'a genre schedule is required.');
  }
  for (const day of weekdays) {
    if (!supportedGenres.has(bench.genreSchedule[day])) {
      throw new BenchConfigurationError(benchId, `a supported genre must be configured for ${day}.`);
    }
  }
  if (!Array.isArray(catalogue)) {
    throw new TypeError('The music catalogue must be an array. Use an empty array when no tracks are available.');
  }

  let local;
  try {
    local = getBenchLocalDate(currentDate, bench.timezone);
  } catch (error) {
    if (error instanceof RangeError && error.message.includes('session date')) throw error;
    throw new RangeError(`Bench “${bench.id}” has an invalid timezone: ${bench.timezone}`);
  }
  const genre = bench.genreSchedule?.[local.weekday];
  if (!genre) throw new Error(`Bench “${bench.id}” has no ${local.weekday} genre configured.`);

  const availableSongs = [];
  const unavailableSongs = [];
  for (const song of catalogue) {
    const check = checkSong(song, genre, assetPaths);
    if (!check) continue;
    if (check.reason) unavailableSongs.push({ ...check.song, unavailableReason: check.reason });
    else availableSongs.push(check.song);
  }

  return {
    bench,
    localDate: local.date,
    weekday: local.weekday,
    genre,
    songs: availableSongs,
    unavailableSongs,
  };
}
