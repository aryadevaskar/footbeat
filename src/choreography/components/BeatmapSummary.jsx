import { summarizeBeatmap } from '../movementPreview.js';

function intervalLabel(seconds) {
  return seconds == null ? '—' : `${seconds.toFixed(2)}s`;
}

export default function BeatmapSummary({ beatmap }) {
  const summary = summarizeBeatmap(beatmap);
  const metrics = [
    ['DETECTED BEATS', summary.detectedBeatCount],
    ['ASSIGNED MOVES', summary.movementCount],
    ['OPEN BEATS', summary.openBeatCount],
    ['LEFT FOOT', summary.leftFootCount],
    ['RIGHT FOOT', summary.rightFootCount],
    ['FRONT PADS', summary.frontPadCount],
    ['REAR PADS', summary.rearPadCount],
    ['AVG. MOVE GAP', intervalLabel(summary.averageMovementInterval)],
  ];

  return (
    <section className="beatmap-summary" aria-label="Choreography summary">
      {metrics.map(([label, value]) => (
        <div className="beatmap-summary-metric" key={label}>
          <span>{label}</span><strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}
