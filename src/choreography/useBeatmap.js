import { useCallback, useState } from 'react';
import { generateChoreography } from './generateChoreography.js';

export default function useBeatmap(result) {
  const [difficulty, setDifficultyState] = useState('easy');
  const [beatmap, setBeatmap] = useState(null);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [error, setError] = useState('');

  const setDifficulty = useCallback((nextDifficulty) => {
    setDifficultyState(nextDifficulty);
    setBeatmap(null);
    setSelectedStepId(null);
    setError('');
  }, []);

  const generate = useCallback(() => {
    try {
      const nextBeatmap = generateChoreography({
        duration: result.duration,
        estimatedBpm: result.estimated_bpm,
        beatTimes: result.beat_times,
        difficulty,
      });
      setBeatmap(nextBeatmap);
      setSelectedStepId(null);
      setError('');
      return nextBeatmap;
    } catch (generationError) {
      setBeatmap(null);
      setSelectedStepId(null);
      setError(generationError.message || 'Could not generate a movement map for this track.');
      return null;
    }
  }, [difficulty, result]);

  const selectStep = useCallback((stepId) => setSelectedStepId(stepId), []);

  return { difficulty, setDifficulty, beatmap, generate, selectedStepId, selectStep, error };
}
