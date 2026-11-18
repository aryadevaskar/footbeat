import { formatTime } from './songFiles.js';
import TutorialButton from '../onboarding/components/TutorialButton.jsx';

function PlaybackIcon({ playing }) {
  return playing
    ? <span className="pause-icon" aria-hidden="true"><i /><i /></span>
    : <span className="play-icon" aria-hidden="true" />;
}

export default function AudioPlayerScreen({ track, playback, analysisStatus, analysisError, hasAnalysis, onAnalyse, onViewAnalysis, onBack }) {
  const { status, duration, currentTime, error, togglePlayback, seek, restart } = playback;
  const isPlaying = status === 'playing';
  const canPlay = status !== 'loading' && status !== 'error' && status !== 'idle';
  const statusLabel = {
    loading: 'LOADING TRACK',
    playing: 'NOW PLAYING',
    paused: 'PAUSED',
    ended: 'TRACK ENDED',
    error: 'TRACK ERROR',
    idle: 'READY',
  }[status];

  return (
    <section className="audio-stage player-stage" aria-labelledby="audio-player-title">
      <button className="audio-back-button" type="button" onClick={onBack}>← <span>Back to song selection</span></button>
      <p className="eyebrow"><span>02</span> &nbsp; LOCAL PLAYER</p>
      <div className="player-card">
        <div className="player-art" aria-hidden="true"><span>♫</span><i /><i /><i /></div>
        <div className="player-status"><span className={`player-status-light player-status-light--${status}`} />{statusLabel}</div>
        <h1 id="audio-player-title" title={track.file.name}>{track.file.name}</h1>
        <p className="player-subtitle">LOCAL MP3 <span>·</span> READY WHEN YOU ARE</p>

        <div className="seek-control">
          <label className="visually-hidden" htmlFor="track-seek">Seek through track</label>
          <input
            id="track-seek"
            type="range"
            min="0"
            max={duration || 0}
            step="0.01"
            value={Math.min(currentTime, duration || 0)}
            disabled={!duration || status === 'error'}
            onChange={(event) => seek(event.target.value)}
            style={{ '--seek-progress': duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
          <div className="time-readout" aria-live="off"><span>{formatTime(currentTime)}</span><span>{duration ? formatTime(duration) : '—:—'}</span></div>
        </div>

        <div className="player-controls">
          <button className="restart-button" type="button" onClick={restart} disabled={!duration || status === 'error'} aria-label="Restart track" title="Restart track">↺</button>
          <button className="playback-button" type="button" onClick={togglePlayback} disabled={!canPlay} aria-label={isPlaying ? 'Pause track' : 'Play track'}>
            <PlaybackIcon playing={isPlaying} />
          </button>
          <span className="player-control-balance" aria-hidden="true" />
        </div>

        {status === 'loading' && <p className="audio-message" role="status">Loading MP3 details…</p>}
        {error && <p className="audio-message audio-message--error" role="alert">{error}</p>}
        {status === 'ended' && <p className="audio-message" role="status">Track finished. Press play to listen again.</p>}
      </div>
      <div className="analysis-action-panel">
        <div className="analysis-action-copy">
          <span>FIRST LOOK</span>
          <strong>Find the pulse in your track</strong>
          <p>Estimate tempo and mark detected beats from the audio.</p>
        </div>
        <div className="analysis-action-buttons">
          <button className="analyse-button" type="button" onClick={onAnalyse} disabled={analysisStatus === 'loading'}>
            {analysisStatus === 'loading' ? <><span className="analysis-spinner" aria-hidden="true" /> Analysing rhythm…</> : hasAnalysis ? 'Analyse again' : 'Analyse rhythm'}
          </button>
          {hasAnalysis && <button className="view-analysis-button" type="button" onClick={onViewAnalysis}>View results →</button>}
        </div>
      </div>
      {analysisStatus === 'error' && <p className="audio-message audio-message--error analysis-request-error" role="alert">{analysisError}</p>}
      <div className="player-footer">
        <TutorialButton variant="secondary" onClick={onBack}>← Song selection</TutorialButton>
        <span>PLAYBACK STAYS ON THIS DEVICE</span>
      </div>
    </section>
  );
}
