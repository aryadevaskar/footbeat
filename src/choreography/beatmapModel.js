export function createBeatmap({ duration, estimatedBpm, difficulty, beatCount, steps, warnings = [] }) {
  return {
    version: 1,
    duration,
    estimatedBpm,
    difficulty,
    beatCount,
    movementCount: steps.length,
    restBeatCount: Math.max(0, beatCount - steps.length),
    steps,
    warnings,
  };
}
