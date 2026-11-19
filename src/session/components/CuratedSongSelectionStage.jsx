import TutorialButton from '../../onboarding/components/TutorialButton.jsx';
import { getGenre } from '../../catalogue/genres.js';

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Duration unavailable';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}

export default function CuratedSongSelectionStage({ session, selectedSongId, onSelect, onContinue, onBack }) {
  const genre = getGenre(session.genre);
  return (
    <section className="audio-stage curated-song-stage" aria-labelledby="curated-songs-title">
      <button className="audio-back-button" type="button" onClick={onBack}>← <span>Back</span></button>
      <div className="audio-stage-heading">
        <p className="eyebrow"><span>{session.bench.name}</span> · {genre.label.toUpperCase()} · {session.localDate}</p>
        <h1 id="curated-songs-title">Today’s<br /><span>selection.</span></h1>
        <p className="stage-lede">Choose one track from this bench’s {genre.label} collection.</p>
      </div>

      {session.songs.length ? (
        <div className="curated-song-list" role="list" aria-label={`${genre.label} songs`}>
          {session.songs.map((song) => (
            <button
              className={`curated-song-card${selectedSongId === song.id ? ' is-selected' : ''}`}
              type="button"
              key={song.id}
              aria-pressed={selectedSongId === song.id}
              onClick={() => onSelect(song)}
            >
              <span className="curated-song-index" aria-hidden="true">♫</span>
              <span className="curated-song-copy"><strong>{song.title}</strong><span>{song.artist}</span></span>
              <time className="curated-song-duration" aria-label={`${formatDuration(song.duration)} duration`}>{formatDuration(song.duration)}</time>
              <span className="curated-song-check" aria-hidden="true">{selectedSongId === song.id ? '✓' : '＋'}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="curated-empty-state" role="status">
          <span className="curated-empty-mark" aria-hidden="true">♫</span>
          <h2>No {genre.label} tracks are ready yet.</h2>
          <p>This bench is set to {genre.label} today. Its collection will appear here when licensed audio and prepared beatmaps are added.</p>
          {import.meta.env.DEV && <p className="curated-dev-note">For development, local MP3 analysis remains available in Developer tools.</p>}
        </div>
      )}

      <div className="audio-stage-actions">
        <span className="supported-format">{session.songs.length} TRACK{session.songs.length === 1 ? '' : 'S'} AVAILABLE</span>
        <TutorialButton onClick={onContinue} disabled={!selectedSongId}>Prepare this song</TutorialButton>
      </div>
    </section>
  );
}
