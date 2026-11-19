export const genres = {
  indie: { id: 'indie', label: 'Indie', description: 'Guitar-led sounds and independent voices.' },
  electronic: { id: 'electronic', label: 'Electronic', description: 'Synths, pulses and club-ready rhythms.' },
  'hip-hop': { id: 'hip-hop', label: 'Hip-hop', description: 'Beat-driven tracks across hip-hop.' },
  pop: { id: 'pop', label: 'Pop', description: 'Melodies and hooks made to move to.' },
};

export function getGenre(genreId) {
  return genres[genreId] ?? { id: genreId, label: genreId || 'Unknown genre', description: '' };
}
