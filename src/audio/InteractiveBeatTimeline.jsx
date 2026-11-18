import { memo, useCallback, useEffect, useRef } from 'react';
import { formatTime } from './songFiles.js';

function findLastBeatAtOrBefore(times, currentTime) {
  let low = 0;
  let high = times.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (times[middle] <= currentTime) low = middle + 1;
    else high = middle;
  }
  return low - 1;
}

function InteractiveBeatTimeline({ beatTimes, duration, audioRef, seek, beatmapSteps = [], selectedStepId = null, movementStatuses = {}, onSelectMovement, onAudioClock }) {
  const timelineRef = useRef(null);
  const playheadRef = useRef(null);
  const markerRefs = useRef([]);
  const frameRef = useRef(null);
  const lastPlayedRef = useRef(-1);
  const hitRef = useRef(-1);
  const movementBeatIndices = new Set(beatmapSteps.map((step) => step.beatIndex));

  const syncVisuals = useCallback((time, allowHit = false, reason = 'sync', playingOverride = null, endedOverride = null) => {
    const safeTime = Math.max(0, Math.min(time || 0, duration || 0));
    const progress = duration > 0 ? (safeTime / duration) * 100 : 0;
    if (playheadRef.current) playheadRef.current.style.left = `${progress}%`;
    if (timelineRef.current) {
      timelineRef.current.setAttribute('aria-valuenow', String(safeTime));
      timelineRef.current.setAttribute('aria-valuetext', `${formatTime(safeTime)} of ${formatTime(duration)}`);
    }
    const audio = audioRef.current;
    onAudioClock?.(
      safeTime,
      reason,
      playingOverride ?? Boolean(audio && !audio.paused && !audio.ended),
      endedOverride ?? Boolean(audio?.ended),
    );

    const nextPlayed = findLastBeatAtOrBefore(beatTimes, safeTime);
    const previousPlayed = lastPlayedRef.current;
    if (nextPlayed > previousPlayed) {
      for (let index = previousPlayed + 1; index <= nextPlayed; index += 1) {
        markerRefs.current[index]?.classList.add('beat-marker--played');
      }
    } else if (nextPlayed < previousPlayed) {
      for (let index = nextPlayed + 1; index <= previousPlayed; index += 1) {
        markerRefs.current[index]?.classList.remove('beat-marker--played');
      }
    }
    lastPlayedRef.current = nextPlayed;

    const hitIndex = allowHit && nextPlayed >= 0 && safeTime - beatTimes[nextPlayed] <= 0.19
      ? nextPlayed
      : -1;
    if (hitRef.current !== hitIndex) {
      markerRefs.current[hitRef.current]?.classList.remove('beat-marker--hit');
      markerRefs.current[hitIndex]?.classList.add('beat-marker--hit');
      hitRef.current = hitIndex;
    }
  }, [audioRef, beatTimes, duration, onAudioClock]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const cancelFrame = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };

    const tick = () => {
      frameRef.current = null;
      syncVisuals(audio.currentTime, true, audio.seeking ? 'seeking' : 'frame', true, false);
      if (!audio.paused && !audio.ended) frameRef.current = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(tick);
    };
    const pause = () => {
      cancelFrame();
      syncVisuals(audio.currentTime, false, 'pause', false, audio.ended);
    };
    const seeking = () => syncVisuals(audio.currentTime, false, 'seeking');
    const seeked = () => syncVisuals(audio.currentTime, false, 'seeked');
    const timeUpdate = () => syncVisuals(audio.currentTime, false, audio.seeking ? 'seeking' : 'timeupdate');
    const play = () => {
      syncVisuals(audio.currentTime, false, 'play', true, false);
      start();
    };
    const ended = () => {
      cancelFrame();
      syncVisuals(audio.currentTime, false, 'ended', false, true);
    };

    syncVisuals(audio.currentTime, false, 'sync', !audio.paused && !audio.ended, audio.ended);
    if (!audio.paused && !audio.ended) start();
    audio.addEventListener('play', play);
    audio.addEventListener('pause', pause);
    audio.addEventListener('seeking', seeking);
    audio.addEventListener('seeked', seeked);
    audio.addEventListener('timeupdate', timeUpdate);
    audio.addEventListener('ended', ended);

    return () => {
      cancelFrame();
      audio.removeEventListener('play', play);
      audio.removeEventListener('pause', pause);
      audio.removeEventListener('seeking', seeking);
      audio.removeEventListener('seeked', seeked);
      audio.removeEventListener('timeupdate', timeUpdate);
      audio.removeEventListener('ended', ended);
    };
  }, [audioRef, syncVisuals]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    lastPlayedRef.current = -1;
    hitRef.current = -1;
    syncVisuals(audio.currentTime, false, 'sync', !audio.paused && !audio.ended, audio.ended);
  }, [audioRef, beatmapSteps, syncVisuals]);

  const seekFromPointer = (event) => {
    if (!duration || !timelineRef.current) return;
    const bounds = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    seek(ratio * duration);
    syncVisuals(ratio * duration, false, 'seeking');
  };

  const seekFromKey = (event) => {
    if (!duration) return;
    let nextTime = audioRef.current?.currentTime ?? 0;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextTime -= 5;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextTime += 5;
    else if (event.key === 'Home') nextTime = 0;
    else if (event.key === 'End') nextTime = duration;
    else return;
    event.preventDefault();
    seek(Math.max(0, Math.min(duration, nextTime)));
  };

  return (
    <div
      ref={timelineRef}
      className="beat-timeline beat-timeline--interactive"
      role="slider"
      tabIndex={duration > 0 ? 0 : -1}
      aria-label="Seek through detected beat timeline"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={0}
      aria-valuetext={`0:00 of ${formatTime(duration)}`}
      onPointerDown={seekFromPointer}
      onKeyDown={seekFromKey}
    >
      <div className="timeline-track" />
      <div className="timeline-start" />
      <div className="timeline-end" />
      {beatTimes.map((time, index) => (
        <span
          ref={(element) => { markerRefs.current[index] = element; }}
          className={`beat-marker${movementBeatIndices.has(index) ? ' beat-marker--assigned' : ' beat-marker--rest'}`}
          key={`${index}-${time}`}
          style={{ left: `${duration > 0 ? Math.max(0, Math.min(100, (time / duration) * 100)) : 0}%` }}
          title={`Beat ${index + 1} at ${time.toFixed(2)} seconds`}
          aria-hidden="true"
        />
      ))}
      {beatmapSteps.map((step) => (
        <span
          className={`beatmap-marker beatmap-marker--${step.targetZone} beatmap-marker--${movementStatuses[step.id] ?? 'upcoming'}${selectedStepId === step.id ? ' is-selected' : ''}`}
          key={step.id}
          style={{ left: `${duration > 0 ? Math.max(0, Math.min(100, (step.timestamp / duration) * 100)) : 0}%` }}
          title={`Beat ${step.beatIndex + 1}: ${step.targetZone.replace('-', ' ')} at ${step.timestamp.toFixed(2)} seconds`}
          aria-hidden="true"
          onPointerDown={(event) => {
            event.stopPropagation();
            onSelectMovement?.(step);
          }}
        />
      ))}
      <span className="timeline-playhead" ref={playheadRef} aria-hidden="true" />
    </div>
  );
}

export default memo(InteractiveBeatTimeline);
