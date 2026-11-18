import { useRef } from 'react';
import TutorialButton from '../onboarding/components/TutorialButton.jsx';

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'MP3 AUDIO FILE';
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB · MP3 AUDIO`;
}

export default function SongSelectionScreen({ track, error, onChooseFile, onContinue, onBack }) {
  const inputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onChooseFile(file);
    event.target.value = '';
  };

  return (
    <section className="audio-stage song-selection-stage" aria-labelledby="song-selection-title">
      <button className="audio-back-button" type="button" onClick={onBack}>← <span>Back to tutorial</span></button>
      <div className="audio-stage-heading">
        <p className="eyebrow"><span>01</span> &nbsp; YOUR FIRST TRACK</p>
        <h1 id="song-selection-title">Choose your<br /><span>first track.</span></h1>
        <p className="stage-lede">FOOTBEAT currently plays local MP3 files from your computer. Pick a track you love and we’ll get it ready.</p>
      </div>

      <div className={`song-picker-card${track ? ' song-picker-card--selected' : ''}`}>
        <div className="song-picker-icon" aria-hidden="true">♫</div>
        {track ? (
          <div className="selected-track" aria-live="polite">
            <span className="selected-track-label">TRACK SELECTED</span>
            <strong title={track.file.name}>{track.file.name}</strong>
            <span>{formatFileSize(track.file.size)}</span>
          </div>
        ) : (
          <div className="song-empty-state">
            <strong>No track selected yet</strong>
            <span>Your first song starts with a file from your library.</span>
          </div>
        )}
        <button className="file-picker-button" type="button" onClick={() => inputRef.current?.click()}>
          {track ? 'Replace MP3' : 'Choose an MP3'} <span aria-hidden="true">↗</span>
        </button>
        <input
          ref={inputRef}
          className="visually-hidden-file-input"
          type="file"
          accept=".mp3,audio/mpeg,audio/mp3"
          aria-label="Choose a local MP3 file"
          onChange={handleFileChange}
        />
      </div>

      {error && <p className="audio-message audio-message--error" role="alert">{error}</p>}
      <p className="local-file-note"><span aria-hidden="true">◇</span> Your track stays on this device. It isn’t uploaded anywhere.</p>

      <div className="audio-stage-actions">
        <span className="supported-format">SUPPORTED FORMAT <strong>.MP3</strong></span>
        <TutorialButton onClick={onContinue} disabled={!track}>Continue to player</TutorialButton>
      </div>
    </section>
  );
}
