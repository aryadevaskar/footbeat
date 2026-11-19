import { useEffect, useRef, useState } from 'react';
import { zones } from '../../data/zones.js';
import FootbeatDevice from '../../components/FootbeatDevice.jsx';
import InstructionDisplay from '../../components/InstructionDisplay.jsx';
import { findActiveCueIndex } from '../gameplayCue.js';

const zoneById = new Map(zones.map((zone) => [zone.id, zone]));
const keyToZone = new Map(zones.map((zone) => [zone.key.toLowerCase(), zone]));

export default function LiveGameplayCue({ beatmap, audioRef }) {
  const steps = beatmap.steps;
  const [playbackCue, setPlaybackCue] = useState({ stepIndex: -1, ended: false, feedback: null });
  const [transitionZoneId, setTransitionZoneId] = useState(null);
  const previousStepRef = useRef(-1);
  const timerRef = useRef(null);
  const currentStep = steps[playbackCue.stepIndex] ?? null;
  const targetZone = currentStep ? zoneById.get(currentStep.targetZone) : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    let frame = null;
    let disposed = false;
    const sync = () => {
      if (disposed) return;
      const stepIndex = findActiveCueIndex(steps, audio.currentTime);
      setPlaybackCue((state) => {
        const ended = audio.ended;
        if (state.stepIndex === stepIndex && state.ended === ended) return state;
        return { stepIndex, ended, feedback: null };
      });
    };
    const animate = () => {
      sync();
      if (!audio.paused && !audio.ended) frame = requestAnimationFrame(animate);
      else frame = null;
    };
    const start = () => {
      sync();
      if (frame === null) frame = requestAnimationFrame(animate);
    };
    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      sync();
    };
    const onEnded = () => {
      stop();
      setPlaybackCue((state) => ({ ...state, stepIndex: -1, ended: true, feedback: null }));
    };

    audio.addEventListener('play', start);
    audio.addEventListener('pause', stop);
    audio.addEventListener('timeupdate', sync);
    audio.addEventListener('seeking', sync);
    audio.addEventListener('seeked', sync);
    audio.addEventListener('ended', onEnded);
    sync();
    if (!audio.paused && !audio.ended) start();

    return () => {
      disposed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      audio.removeEventListener('play', start);
      audio.removeEventListener('pause', stop);
      audio.removeEventListener('timeupdate', sync);
      audio.removeEventListener('seeking', sync);
      audio.removeEventListener('seeked', sync);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioRef, steps]);

  useEffect(() => {
    if (previousStepRef.current === playbackCue.stepIndex) return undefined;
    previousStepRef.current = playbackCue.stepIndex;
    setPlaybackCue((state) => state.feedback ? { ...state, feedback: null } : state);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!targetZone) {
      setTransitionZoneId(null);
      return undefined;
    }
    setTransitionZoneId(targetZone.id);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setTransitionZoneId(null);
    }, 430);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [playbackCue.stepIndex, targetZone]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const handleKeyDown = (event) => {
      const inputZone = keyToZone.get(event.key.toLowerCase());
      if (!inputZone || event.repeat || !currentStep || !audio || audio.paused || audio.ended) return;
      event.preventDefault();
      setPlaybackCue((state) => ({
        ...state,
        feedback: { zoneId: inputZone.id, state: inputZone.id === currentStep.targetZone ? 'correct' : 'incorrect' },
      }));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioRef, currentStep]);

  return (
    <div className="practice-device-wrap">
      <InstructionDisplay
        title={playbackCue.ended ? 'TRACK COMPLETE' : currentStep ? `MOVE ${String(currentStep.beatIndex + 1).padStart(3, '0')}` : 'LISTEN FOR THE FIRST CUE'}
        hint={targetZone ? `${targetZone.foot} · ${targetZone.depth.toLowerCase()} · press ${targetZone.key}` : 'Movement prompts follow the generated beatmap'}
        cue={targetZone ? `${targetZone.side} ${targetZone.depth}` : '— —'}
        keyHint={targetZone?.key ?? null}
        state={playbackCue.feedback?.state ?? (targetZone ? 'active' : 'idle')}
      />
      <FootbeatDevice
        activeZoneId={targetZone?.id ?? null}
        transitionZoneId={transitionZoneId}
        feedbackZoneId={playbackCue.feedback?.zoneId ?? null}
        feedbackState={playbackCue.feedback?.state ?? null}
      />
      <div className="keyboard-map" aria-label="Keyboard pressure-zone controls">
        {zones.map((zone) => <span key={zone.id}><kbd>{zone.key}</kbd> {zone.side} {zone.position}</span>)}
      </div>
      <p className="practice-device-note" role="status" aria-live="polite">
        {playbackCue.ended
          ? 'TRACK COMPLETE · REPLAY TO RUN THE CUES AGAIN'
          : playbackCue.feedback?.state === 'correct'
            ? 'MATCHING ZONE PRESSED'
            : playbackCue.feedback?.state === 'incorrect'
              ? 'THAT KEY DOES NOT MATCH THE ACTIVE CUE'
              : targetZone ? 'FOLLOW THE HIGHLIGHTED PRESSURE ZONE' : 'WAITING FOR THE NEXT MOVEMENT CUE'}
      </p>
    </div>
  );
}
