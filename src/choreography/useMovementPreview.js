import { useCallback, useRef, useState } from 'react';
import { advanceMovementPreview, createMovementPreviewState } from './movementPreview.js';

function visibleState(state, steps) {
  return {
    steps,
    activeStepId: state.activeStepId,
    completedStepIds: state.completedStepIds,
    skippedStepIds: state.skippedStepIds,
    isPlaying: state.isPlaying,
    isEnded: state.isEnded,
    revision: state.revision,
  };
}

export default function useMovementPreview(steps) {
  const stateRef = useRef({ steps, state: createMovementPreviewState() });
  const [preview, setPreview] = useState(() => visibleState(stateRef.current.state, steps));

  const onAudioClock = useCallback((currentTime, reason, isPlaying, isEnded = false) => {
    if (stateRef.current.steps !== steps) {
      stateRef.current = { steps, state: createMovementPreviewState() };
    }

    const previous = stateRef.current.state;
    const next = advanceMovementPreview(previous, steps, { currentTime, reason, isPlaying, isEnded });
    stateRef.current.state = next;
    if (next.revision !== previous.revision) setPreview(visibleState(next, steps));
  }, [steps]);

  if (preview.steps !== steps) {
    return {
      ...visibleState(createMovementPreviewState(), steps),
      onAudioClock,
    };
  }

  return { ...preview, onAudioClock };
}
