import { zones } from '../data/zones.js';

const zoneById = new Map(zones.map((zone) => [zone.id, zone]));

export function createMovementPreviewState() {
  return {
    currentTime: 0,
    activeStepId: null,
    completedStepIds: new Set(),
    skippedStepIds: new Set(),
    isPlaying: false,
    isEnded: false,
    initialized: false,
    revision: 0,
  };
}

function findActiveStep(steps, currentTime) {
  let low = 0;
  let high = steps.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (steps[middle].timestamp <= currentTime) low = middle + 1;
    else high = middle;
  }
  return steps[low - 1] ?? null;
}

function firstStepAfter(steps, currentTime) {
  let low = 0;
  let high = steps.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (steps[middle].timestamp <= currentTime) low = middle + 1;
    else high = middle;
  }
  return low;
}

function firstStepAtOrAfter(steps, currentTime) {
  let low = 0;
  let high = steps.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (steps[middle].timestamp < currentTime) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function advanceMovementPreview(state, steps, { currentTime, reason = 'frame', isPlaying = false, isEnded = false }) {
  if (!Number.isFinite(currentTime)) return state;

  const time = Math.max(0, currentTime);
  if (reason === 'seeking') return state;
  let completedStepIds = state.completedStepIds;
  let skippedStepIds = state.skippedStepIds;
  let changed = false;

  const addCompleted = (step) => {
    if (!completedStepIds.has(step.id)) {
      if (completedStepIds === state.completedStepIds) completedStepIds = new Set(completedStepIds);
      completedStepIds.add(step.id);
      changed = true;
    }
    if (skippedStepIds.has(step.id)) {
      if (skippedStepIds === state.skippedStepIds) skippedStepIds = new Set(skippedStepIds);
      skippedStepIds.delete(step.id);
      changed = true;
    }
  };

  const removeAfter = (collectionName) => {
    const source = collectionName === 'completed' ? completedStepIds : skippedStepIds;
    let next = source;
    for (let index = firstStepAtOrAfter(steps, time); index < steps.length; index += 1) {
      const step = steps[index];
      if (source.has(step.id)) {
        if (next === source) next = new Set(source);
        next.delete(step.id);
        changed = true;
      }
    }
    if (collectionName === 'completed') completedStepIds = next;
    else skippedStepIds = next;
  };

  if (!state.initialized && reason === 'sync') {
    for (const step of steps) {
      if (step.timestamp < time) addCompleted(step);
    }
  } else if (reason === 'seeked') {
    if (time > state.currentTime) {
      const start = firstStepAfter(steps, state.currentTime);
      const end = firstStepAtOrAfter(steps, time);
      for (let index = start; index < end; index += 1) {
        const step = steps[index];
        if (!completedStepIds.has(step.id)) {
          if (skippedStepIds === state.skippedStepIds) skippedStepIds = new Set(skippedStepIds);
          if (!skippedStepIds.has(step.id)) {
            skippedStepIds.add(step.id);
            changed = true;
          }
        }
      }
    } else if (time < state.currentTime) {
      removeAfter('completed');
      removeAfter('skipped');
    }
  } else if (state.isPlaying && time > state.currentTime) {
    const start = firstStepAfter(steps, state.currentTime);
    const end = firstStepAfter(steps, time);
    for (let index = start; index < end; index += 1) addCompleted(steps[index]);
  }

  const hasEnded = isEnded || reason === 'ended';
  if (hasEnded) {
    for (const step of steps) {
      if (!completedStepIds.has(step.id)) {
        if (completedStepIds === state.completedStepIds) completedStepIds = new Set(completedStepIds);
        completedStepIds.add(step.id);
        changed = true;
      }
    }
  }

  const candidateActiveStep = hasEnded ? null : findActiveStep(steps, time);
  const activeStepId = candidateActiveStep && !skippedStepIds.has(candidateActiveStep.id)
    ? candidateActiveStep.id
    : null;
  if (activeStepId !== state.activeStepId || Boolean(isPlaying) !== state.isPlaying || hasEnded !== state.isEnded) changed = true;

  return {
    currentTime: time,
    activeStepId,
    completedStepIds,
    skippedStepIds,
    isPlaying: Boolean(isPlaying) && !hasEnded,
    isEnded: hasEnded,
    initialized: true,
    revision: state.revision + Number(changed),
  };
}

export function getMovementStatuses(steps, state) {
  return Object.fromEntries(steps.map((step) => {
    if (!state.isEnded && step.id === state.activeStepId) return [step.id, 'active'];
    if (state.skippedStepIds.has(step.id)) return [step.id, 'missed'];
    if (state.completedStepIds.has(step.id)) return [step.id, 'completed'];
    return [step.id, 'upcoming'];
  }));
}

export function summarizeBeatmap(beatmap) {
  const counts = { left: 0, right: 0, front: 0, back: 0 };
  for (const step of beatmap.steps) {
    const zone = zoneById.get(step.targetZone);
    if (!zone) continue;
    counts[zone.side.toLowerCase()] += 1;
    counts[zone.position] += 1;
  }

  const intervals = beatmap.steps.slice(1).map((step, index) => step.timestamp - beatmap.steps[index].timestamp);
  const averageMovementInterval = intervals.length
    ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    : null;

  return {
    detectedBeatCount: beatmap.beatCount,
    movementCount: beatmap.steps.length,
    openBeatCount: Math.max(0, beatmap.beatCount - beatmap.steps.length),
    leftFootCount: counts.left,
    rightFootCount: counts.right,
    frontPadCount: counts.front,
    rearPadCount: counts.back,
    averageMovementInterval,
  };
}
