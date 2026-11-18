import { useCallback, useEffect, useRef, useState } from 'react';
import { analyseTrack } from './analysisApi.js';

const idleState = { status: 'idle', result: null, error: '' };

export default function useRhythmAnalysis() {
  const [analysis, setAnalysis] = useState(idleState);
  const request = useRef(null);

  const reset = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setAnalysis(idleState);
  }, []);

  const analyse = useCallback(async (file) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setAnalysis({ status: 'loading', result: null, error: '' });

    try {
      const result = await analyseTrack(file, { signal: controller.signal });
      if (request.current !== controller) return null;
      setAnalysis({ status: 'success', result, error: '' });
      return result;
    } catch (error) {
      if (error.name === 'AbortError' || request.current !== controller) return null;
      setAnalysis({ status: 'error', result: null, error: error.message || 'Audio analysis failed. Try again.' });
      return null;
    }
  }, []);

  useEffect(() => () => request.current?.abort(), []);

  return { ...analysis, analyse, reset };
}
