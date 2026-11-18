import { useEffect, useRef, useState } from 'react';
import { zones } from '../../data/zones.js';
import FootbeatDevice from '../../components/FootbeatDevice.jsx';
import InstructionDisplay from '../../components/InstructionDisplay.jsx';
import BeatmapEventList from './BeatmapEventList.jsx';
import BeatmapSummary from './BeatmapSummary.jsx';

const zoneById = new Map(zones.map((zone) => [zone.id, zone]));

export default function BeatmapPreview({ beatmap, selectedStepId, movementStatuses, activeStepId, isPreviewPlaying, isEnded, onSelectStep }) {
  const selectedStep = beatmap.steps.find((step) => step.id === selectedStepId) ?? null;
  const activeStep = beatmap.steps.find((step) => step.id === activeStepId) ?? null;
  const displayStep = activeStep ?? (!isPreviewPlaying ? selectedStep : null);
  const displayZone = displayStep ? zoneById.get(displayStep.targetZone) : null;
  const selectedZone = selectedStep ? zoneById.get(selectedStep.targetZone) : null;
  const [transitionZoneId, setTransitionZoneId] = useState(null);
  const previousStepRef = useRef(null);
  const previousBeatmapRef = useRef(beatmap);

  useEffect(() => {
    if (previousBeatmapRef.current !== beatmap) {
      previousBeatmapRef.current = beatmap;
      previousStepRef.current = displayStep?.id ?? null;
      setTransitionZoneId(null);
      return undefined;
    }
    const previousStepId = previousStepRef.current;
    previousStepRef.current = displayStep?.id ?? null;
    if (!displayStep || !previousStepId || displayStep.id === previousStepId) {
      setTransitionZoneId(null);
      return undefined;
    }

    setTransitionZoneId(displayStep.targetZone);
    const timeout = window.setTimeout(() => setTransitionZoneId(null), 430);
    return () => window.clearTimeout(timeout);
  }, [beatmap, displayStep?.id, displayStep?.targetZone]);

  return (
    <section className="beatmap-preview" aria-labelledby="beatmap-preview-title">
      <div className="beatmap-preview-heading">
        <div><p className="section-label">{beatmap.difficulty.toUpperCase()} ROUTINE</p><h2 id="beatmap-preview-title">Movement preview</h2></div>
        <p><strong>{beatmap.movementCount}</strong> moves <span>·</span> <strong>{beatmap.restBeatCount}</strong> open beats</p>
      </div>
      {beatmap.warnings.map((warning) => <p className="beatmap-warning" role="status" key={warning}>{warning}</p>)}
      <BeatmapSummary beatmap={beatmap} />
      <div className="beatmap-preview-layout">
        <BeatmapEventList
          steps={beatmap.steps}
          selectedStepId={selectedStepId}
          movementStatuses={movementStatuses}
          activeStepId={activeStepId}
          isPreviewPlaying={isPreviewPlaying}
          onSelectStep={onSelectStep}
        />
        <aside className="beatmap-device-preview" aria-label="Selected movement on the FOOTBEAT device">
          <InstructionDisplay
            title={displayStep ? `BEAT ${String(displayStep.beatIndex + 1).padStart(2, '0')} · ${displayStep.timestamp.toFixed(2)} SEC` : isEnded ? 'PREVIEW COMPLETE' : 'SELECT A MOVEMENT'}
            hint={displayZone ? `${displayZone.foot} · ${displayZone.depth.toLowerCase()}` : 'Choose a step or preview the track'}
            cue={displayZone ? `${displayZone.side} ${displayZone.depth}` : '— —'}
            keyHint={displayZone?.key ?? null}
            state={displayStep ? 'active' : 'idle'}
          />
          <FootbeatDevice
            activeZoneId={activeStep?.targetZone ?? null}
            selectedZoneId={selectedStep && selectedStep.id !== activeStep?.id ? selectedZone?.id : null}
            transitionZoneId={transitionZoneId}
          />
          <p className="beatmap-device-note">{activeStep ? 'CURRENT CUE' : selectedStep ? 'SELECTED CUE' : 'NO CUE SELECTED'}</p>
        </aside>
      </div>
    </section>
  );
}
