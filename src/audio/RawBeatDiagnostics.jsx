import { useMemo } from 'react';
import { formatTime } from './songFiles.js';
import { getBeatIntervalRows, getBeatIntervalSummary } from './beatDiagnostics.js';

function RawBeatDiagnostics({ beatTimes, duration, diagnostics, playheadRef, trackRef, audioRef, seek, canSeek }) {
  const rows = useMemo(() => getBeatIntervalRows(beatTimes), [beatTimes]);
  const summary = useMemo(() => getBeatIntervalSummary(beatTimes), [beatTimes]);
  const intervalDiagnostics = diagnostics?.intervals;
  const warnings = diagnostics?.warnings ?? [];
  const activityRanges = diagnostics?.activity_ranges_seconds ?? [];
  const discardedBeatTimes = diagnostics?.discarded_beat_times ?? [];

  const seekFromPointer = (event) => {
    if (!canSeek || !duration) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    seek(ratio * duration);
  };

  const seekFromKey = (event) => {
    if (!canSeek || !duration) return;
    const current = audioRef.current?.currentTime ?? Number(event.currentTarget.getAttribute('aria-valuenow')) ?? 0;
    let target = current;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') target -= 5;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') target += 5;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = duration;
    else return;
    event.preventDefault();
    seek(Math.max(0, Math.min(duration, target)));
  };

  return (
    <section className="raw-beat-diagnostics" aria-labelledby="raw-beat-title">
      <div className="raw-beat-heading">
        <div>
          <p className="section-label">ANALYSIS DIAGNOSTIC</p>
          <h2 id="raw-beat-title">Raw detected beats</h2>
          <p>These are the beat tracker’s timestamps before choreography assigns any foot zones.</p>
        </div>
        <div className="raw-beat-summary" aria-label="Raw beat summary">
          <span><strong>{Math.round(summary.median ? 60 / summary.median : 0) || '—'}</strong> MEDIAN INTERVAL BPM</span>
          <span><strong>{intervalDiagnostics?.count ?? summary.count}</strong> INTERVALS</span>
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="raw-beat-warnings" aria-label="Beat analysis warnings">
          {warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      )}

      <p className="raw-beat-heuristic-note">
        BPM estimate: {diagnostics?.warning_note ?? 'Interval patterns are descriptive and do not prove musical alignment.'}
      </p>

      <div
        className="raw-beat-track"
        role="slider"
        tabIndex={canSeek && duration > 0 ? 0 : -1}
        aria-label="Seek using raw detected beat timeline"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={0}
        aria-valuetext={`Seek through raw beat positions across ${formatTime(duration)}`}
        onPointerDown={seekFromPointer}
        onKeyDown={seekFromKey}
      >
        <span className="raw-beat-track-line" />
        {beatTimes.map((timestamp, index) => (
          <span
            className="raw-beat-marker"
            key={`${index}-${timestamp}`}
            style={{ left: `${duration > 0 ? Math.max(0, Math.min(100, timestamp / duration * 100)) : 0}%` }}
            title={`Beat ${index + 1}: ${timestamp.toFixed(3)} seconds`}
            aria-hidden="true"
          />
        ))}
        <span ref={playheadRef} className="raw-beat-playhead" aria-hidden="true" />
      </div>
      <div className="raw-beat-axis"><span>0:00</span><span>{formatTime(duration)}</span></div>
      <div className="raw-beat-jump-controls" aria-label="Jump to a section of the song">
        {[['Beginning', 0], ['Middle', 0.5], ['End', 1]].map(([label, ratio]) => (
          <button key={label} type="button" onClick={() => seek(duration * ratio)} disabled={!canSeek || !duration}>
            {label}
          </button>
        ))}
      </div>

      {diagnostics && (
        <details className="raw-beat-method-details">
          <summary>How this beat track was produced</summary>
          <dl>
            <div><dt>Decoder sample rate</dt><dd>{diagnostics.decoded_sample_rate_hz} Hz source; {diagnostics.analysis_sample_rate_hz} Hz mono analysis; {diagnostics.resampled ? 'resampled' : 'no resampling'}.</dd></div>
            <div><dt>Onset signal</dt><dd>{diagnostics.onset_strength?.function}, 512 sample hop; {diagnostics.onset_strength?.parameters}</dd></div>
            <div><dt>Onset envelope level</dt><dd>Mean {Number(diagnostics.onset_strength?.mean ?? 0).toExponential(2)}, standard deviation {Number(diagnostics.onset_strength?.standard_deviation ?? 0).toExponential(2)}, peak {Number(diagnostics.onset_strength?.peak ?? 0).toExponential(2)}.</dd></div>
            <div><dt>Beat tracker</dt><dd>{diagnostics.beat_tracker?.function}, {diagnostics.beat_tracker?.parameters}</dd></div>
            <div><dt>Timestamp conversion</dt><dd>{diagnostics.timestamp_conversion}; no shift applied</dd></div>
            <div><dt>Estimated leading silence</dt><dd>{diagnostics.estimated_leading_silence_seconds == null ? 'No clear audio activity threshold crossing was detected.' : `${Number(diagnostics.estimated_leading_silence_seconds).toFixed(2)} seconds. Earlier detections are filtered; retained beat times stay relative to the file start.`}</dd></div>
            <div><dt>Audio activity range</dt><dd>{activityRanges.length ? activityRanges.map(([start, end]) => `${Number(start).toFixed(2)}–${Number(end).toFixed(2)} s`).join('; ') : 'No meaningful signal activity detected.'} (adaptive RMS threshold {diagnostics.activity_threshold_rms == null ? 'unavailable' : Number(diagnostics.activity_threshold_rms).toExponential(2)}).</dd></div>
            <div><dt>Discarded beat detections</dt><dd>{discardedBeatTimes.length ? discardedBeatTimes.map((timestamp) => `${Number(timestamp).toFixed(3)} s`).join(', ') : 'None.'}</dd></div>
            <div><dt>Detected beat range</dt><dd>{diagnostics.first_detected_beat_seconds == null ? 'No beats detected.' : `${Number(diagnostics.first_detected_beat_seconds).toFixed(3)} s to ${Number(diagnostics.last_detected_beat_seconds).toFixed(3)} s from the file start.`}</dd></div>
            <div><dt>Downbeat detection</dt><dd>Not performed; the first detected beat is not assumed to be beat one of a bar.</dd></div>
            <div><dt>Analysis library</dt><dd>librosa {diagnostics.librosa_version}</dd></div>
          </dl>
        </details>
      )}

      <div className="raw-beat-table-heading"><h3>Beat positions and intervals</h3><span>SECONDS FROM FILE START</span></div>
      {rows.length ? (
        <ol className="raw-beat-table">
          {rows.map(({ beatNumber, timestamp, interval }) => (
            <li key={`${beatNumber}-${timestamp}`}>
              <span>BEAT {String(beatNumber).padStart(2, '0')}</span>
              <time>{timestamp.toFixed(3)} s</time>
              <span className="raw-beat-interval">{interval == null ? '— start —' : `+${interval.toFixed(3)} s`}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="no-beats-message">No beat positions were detected for this track.</p>
      )}
      <p className="raw-beat-list-note">
        {summary.count} intervals · median {summary.median == null ? '—' : `${summary.median.toFixed(3)} s`} ·
        {' '}mean {summary.mean == null ? '—' : `${summary.mean.toFixed(3)} s`} ·
        {' '}variation {summary.coefficientOfVariation == null ? '—' : `${(summary.coefficientOfVariation * 100).toFixed(1)}%`}
      </p>
    </section>
  );
}

export default RawBeatDiagnostics;
