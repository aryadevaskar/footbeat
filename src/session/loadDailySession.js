import { checkAsset } from '../catalogue/prepareSong.js';
import { resolveDailySession } from './resolveDailySession.js';

export async function loadDailySession(options, fetcher = fetch) {
  const initialSession = resolveDailySession(options);
  if (!initialSession.songs.length) return initialSession;

  const assets = [...new Set(initialSession.songs.flatMap((song) => [song.audioAssetPath, song.beatmapRef]))];
  const checks = await Promise.all(assets.map(async (path) => [path, await checkAsset(path, fetcher)]));
  const assetPaths = new Set(checks.filter(([, available]) => available).map(([path]) => path));
  return resolveDailySession({ ...options, assetPaths });
}
