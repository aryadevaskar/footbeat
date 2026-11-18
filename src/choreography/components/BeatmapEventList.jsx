import { useEffect, useRef } from 'react';
import { zones } from '../../data/zones.js';

const zoneById = new Map(zones.map((zone) => [zone.id, zone]));

function formatEventTime(seconds) {
  const wholeHundredths = Math.round(seconds * 100);
  const minutes = Math.floor(wholeHundredths / 6000);
  const remainder = (wholeHundredths % 6000 / 100).toFixed(2).padStart(5, '0');
  return `${minutes}:${remainder}`;
}

const statusLabels = {
  upcoming: 'UP NEXT',
  active: 'ACTIVE',
  completed: 'COMPLETED',
  missed: 'SKIPPED',
};

export default function BeatmapEventList({ steps, selectedStepId, movementStatuses, activeStepId, isPreviewPlaying, onSelectStep }) {
  const itemRefs = useRef(new Map());
  const itemRefCallbacks = useRef(new Map());

  const getItemRef = (stepId) => {
    if (!itemRefCallbacks.current.has(stepId)) {
      itemRefCallbacks.current.set(stepId, (element) => {
        if (element) itemRefs.current.set(stepId, element);
        else itemRefs.current.delete(stepId);
      });
    }
    return itemRefCallbacks.current.get(stepId);
  };

  useEffect(() => {
    if (!isPreviewPlaying || !activeStepId) return;
    const activeItem = itemRefs.current.get(activeStepId);
    if (!activeItem) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    activeItem.scrollIntoView?.({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [steps, activeStepId, isPreviewPlaying]);

  return (
    <section className="beatmap-events" aria-labelledby="beatmap-events-title">
      <div className="beatmap-events-heading">
        <div><p className="section-label">GENERATED MOVEMENTS</p><h3 id="beatmap-events-title">Step sequence</h3></div>
        <span>{steps.length} MOVES</span>
      </div>
      {steps.length ? (
        <ol className="beatmap-event-list">
          {steps.map((step) => {
            const zone = zoneById.get(step.targetZone);
            const status = movementStatuses[step.id] ?? 'upcoming';
            return (
              <li key={step.id} ref={getItemRef(step.id)}>
                <button
                  className={`beatmap-event beatmap-event--${status} beatmap-event--zone-${step.targetZone}${selectedStepId === step.id ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={selectedStepId === step.id}
                  aria-label={`Beat ${step.beatIndex + 1}, ${formatEventTime(step.timestamp)}, ${zone?.foot ?? 'unknown foot'}, ${zone ? `${zone.depth.toLowerCase()} pad` : step.targetZone}, ${statusLabels[status]}`}
                  onClick={() => onSelectStep(step)}
                >
                  <time>{formatEventTime(step.timestamp)}</time>
                  <span className="beatmap-event-beat">BEAT {String(step.beatIndex + 1).padStart(2, '0')}</span>
                  <span className="beatmap-event-target"><strong>{zone?.foot ?? 'Unknown foot'}</strong><span>{zone ? `${zone.side} ${zone.depth}` : step.targetZone}</span></span>
                  <span className={`beatmap-event-status beatmap-event-status--${status}`}>{statusLabels[status]}</span>
                  <span className="beatmap-event-arrow" aria-hidden="true">↗</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="beatmap-empty-message">No movements could be generated. Try another track with more detected beats.</p>
      )}
      <p className="beatmap-list-note">Select a movement to jump to its beat. “Skipped” means the audio cursor moved past it; preview does not judge foot input.</p>
    </section>
  );
}
