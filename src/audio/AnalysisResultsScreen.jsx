import { useCallback, useMemo, useRef } from 'react';
import { formatTime } from './songFiles.js';
import TutorialButton from '../onboarding/components/TutorialButton.jsx';
import InteractiveBeatTimeline from './InteractiveBeatTimeline.jsx';
import useBeatmap from '../choreography/useBeatmap.js';
import ChoreographyControls from '../choreography/components/ChoreographyControls.jsx';
import BeatmapPreview from '../choreography/components/BeatmapPreview.jsx';
import useMovementPreview from '../choreography/useMovementPreview.js';
import { getMovementStatuses } from '../choreography/movementPreview.js';
import RawBeatDiagnostics from './RawBeatDiagnostics.jsx';

const EMPTY_STEPS = [];

function PlaybackIcon({ playing }) {
  return playing
    ? <span className="pause-icon" aria-hidden="true"><i /><i /></span>
    : <span className="play-icon" aria-hidden="true" />;
}

export default function AnalysisResultsScreen({ result, playback, onBack }) {
  const duration = result.duration;
  const { status, currentTime, togglePlayback, seek, restart, audioRef } = playback;
  const rawPlayheadRef = useRef(null);
  const rawTrackRef = useRef(null);
  const isPlaying = status === 'playing';
  const canPlay = duration > 0 && status !== 'loading' && status !== 'error' && status !== 'idle';
  const choreography = useBeatmap(result);
  const beatmapSteps = choreography.beatmap?.steps ?? EMPTY_STEPS;
  const movementPreview = useMovementPreview(beatmapSteps);
  const movementStatuses = useMemo(() => getMovementStatuses(beatmapSteps, movementPreview), [
    beatmapSteps,
    movementPreview.activeStepId,
    movementPreview.completedStepIds,
    movementPreview.skippedStepIds,
    movementPreview.isEnded,
  ]);
  const handleSelectMovement = useCallback((step) => {
    choreography.selectStep(step.id);
    seek(step.timestamp);
  }, [choreography.selectStep, seek]);
  const handleAudioClock = useCallback((time, reason, playing, ended) => {
    movementPreview.onAudioClock(time, reason, playing, ended);
    if (rawPlayheadRef.current) {
      rawPlayheadRef.current.style.left = `${duration > 0 ? Math.max(0, Math.min(100, time / duration * 100)) : 0}%`;
    }
    rawTrackRef.current?.setAttribute('aria-valuenow', String(time));
    rawTrackRef.current?.setAttribute('aria-valuetext', `${formatTime(time)} of ${formatTime(duration)}`);
  }, [duration, movementPreview.onAudioClock]);

  return (
    <section className="audio-stage analysis-results-stage" aria-labelledby="analysis-results-title">
      <button className="audio-back-button" type="button" onClick={onBack}>← <span>Back to player</span></button>
      <div className="analysis-heading">
        <p className="eyebrow"><span>03</span> &nbsp; RHYTHM ANALYSIS</p>
        <h1 id="analysis-results-title">Your track,<br /><span>in rhythm.</span></h1>
        <p className="stage-lede analysis-filename" title={result.filename}>{result.filename}</p>
      </div>

      <div className="analysis-metrics">
        <article className="analysis-metric analysis-metric--tempo">
          <span>ESTIMATED TEMPO</span>
          <strong>{result.estimated_bpm == null ? '—' : Math.round(result.estimated_bpm)}<small>{result.estimated_bpm == null ? 'BPM UNCLEAR' : 'BPM'}</small></strong>
        </article>
        <article className="analysis-metric">
          <span>SONG DURATION</span>
          <strong>{formatTime(result.duration)}</strong>
        </article>
        <article className="analysis-metric">
          <span>DETECTED BEATS</span>
          <strong>{result.beat_count}</strong>
        </article>
      </div>

      {result.warning && <p className="analysis-warning" role="status"><span aria-hidden="true">!</span>{result.warning}</p>}

      <ChoreographyControls
        difficulty={choreography.difficulty}
        onDifficultyChange={choreography.setDifficulty}
        onGenerate={choreography.generate}
        error={choreography.error}
        generated={Boolean(choreography.beatmap)}
        canPreview={canPlay && beatmapSteps.length > 0}
        isPreviewing={isPlaying}
        onTogglePreview={togglePlayback}
      />

      <section className="beat-timeline-section" aria-labelledby="beat-timeline-title">
        <div className="timeline-title-row">
          <div><p className="section-label">DETECTED PULSE</p><h2 id="beat-timeline-title">Beat &amp; movement timeline</h2></div>
          <span>{result.beat_count} MARKERS</span>
        </div>
        {choreography.beatmap && <div className="timeline-legend"><span className="timeline-legend-beat" /> Beat detected <span className="timeline-legend-movement" /> Movement assigned <span className="timeline-legend-rest" /> Open beat</div>}
        <div className="analysis-playback-controls">
          <button className="analysis-restart-button" type="button" onClick={restart} disabled={!canPlay} aria-label="Restart track" title="Restart track">↺</button>
          <button className="playback-button analysis-playback-button" type="button" onClick={togglePlayback} disabled={!canPlay} aria-label={isPlaying ? 'Pause track' : 'Play track'}>
            <PlaybackIcon playing={isPlaying} />
          </button>
          <div className="analysis-seek-control">
            <label className="visually-hidden" htmlFor="analysis-track-seek">Seek through track</label>
            <input
              id="analysis-track-seek"
              type="range"
              min="0"
              max={duration || 0}
              step="0.01"
              value={Math.min(currentTime, duration || 0)}
              disabled={!canPlay}
              onChange={(event) => seek(event.target.value)}
              style={{ '--seek-progress': duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
            <div className="time-readout" aria-live="off"><span>{formatTime(currentTime)}</span><span>{duration ? formatTime(duration) : '—:—'}</span></div>
          </div>
        </div>
        <InteractiveBeatTimeline
          beatTimes={result.beat_times}
          duration={duration}
          audioRef={audioRef}
          seek={seek}
          beatmapSteps={beatmapSteps}
          selectedStepId={choreography.selectedStepId}
          movementStatuses={movementStatuses}
          onSelectMovement={handleSelectMovement}
          onAudioClock={handleAudioClock}
        />
        <div className="timeline-axis"><span>0:00</span><span>{formatTime(duration)}</span></div>
      </section>

      <RawBeatDiagnostics
        beatTimes={result.beat_times}
        duration={duration}
        diagnostics={result.diagnostics}
        playheadRef={rawPlayheadRef}
        trackRef={rawTrackRef}
        audioRef={audioRef}
        seek={seek}
        canSeek={canPlay}
      />

      {choreography.beatmap && (
        <BeatmapPreview
          beatmap={choreography.beatmap}
          selectedStepId={choreography.selectedStepId}
          movementStatuses={movementStatuses}
          activeStepId={movementPreview.activeStepId}
          isPreviewPlaying={movementPreview.isPlaying}
          isEnded={movementPreview.isEnded}
          onSelectStep={handleSelectMovement}
        />
      )}

      <div className="analysis-method-note">METHOD <span>{result.analysis_method}</span></div>
      <div className="player-footer analysis-footer">
        <TutorialButton variant="secondary" onClick={onBack}>← Return to player</TutorialButton>
        <span>BEAT POSITIONS COME FROM THE AUDIO SIGNAL</span>
      </div>
    </section>
  );
}
