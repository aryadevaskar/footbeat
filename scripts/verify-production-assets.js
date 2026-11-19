import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { musicCatalogue } from '../src/catalogue/musicCatalogue.js';

const distDirectory = resolve('dist');
const availableSongs = musicCatalogue.filter((song) => song.availability === 'available');
const missingAssets = [];

for (const song of availableSongs) {
  for (const assetPath of [song.audioAssetPath, song.beatmapRef]) {
    if (typeof assetPath !== 'string' || !assetPath.startsWith('/')) {
      missingAssets.push(`${song.title}: invalid public asset path (${assetPath})`);
      continue;
    }

    const relativePath = assetPath.slice(1);
    const builtPath = resolve(distDirectory, relativePath);
    if (!builtPath.startsWith(`${distDirectory}${sep}`) || !existsSync(builtPath)) {
      missingAssets.push(`${song.title}: ${assetPath} is missing from the production build`);
    }
  }
}

if (!existsSync(resolve(distDirectory, 'index.html'))) {
  missingAssets.push('The production frontend index.html is missing from dist/.');
}

if (missingAssets.length) {
  console.error('Production asset verification failed:');
  for (const missingAsset of missingAssets) console.error(`- ${missingAsset}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${availableSongs.length} available catalogue song(s) and their production assets.`);
}
