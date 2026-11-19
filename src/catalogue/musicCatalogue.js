/**
 * Song entry contract:
 * { id, title, artist, genre, duration, audioAssetPath, beatmapRef, availability }
 * `availability` is `available` only after both local assets are present and validated.
 */
// Add only tracks with cleared usage rights and real audio + prepared beatmap files.
// See public/audio/README.md and public/beatmaps/README.md for the asset contract.
export const musicCatalogue = [
  {
    id: 'dance-monkey',
    title: 'Dance Monkey',
    artist: 'Tones and I',
    genre: 'pop',
    duration: 209.0028117913832,
    audioAssetPath: '/audio/pop/dance_monkey.mp3',
    beatmapRef: '/beatmaps/dance_monkey_easy.json',
    availability: 'available',
  },
];
