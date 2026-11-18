import { useCallback, useEffect, useRef, useState } from 'react';

const initialState = (file) => ({
  status: file ? 'loading' : 'idle',
  currentTime: 0,
  duration: 0,
  error: '',
});

export default function useAudioPlayer(file) {
  const audioRef = useRef(null);
  const [playback, setPlayback] = useState(() => initialState(file));

  useEffect(() => {
    if (!file) {
      audioRef.current = null;
      setPlayback(initialState(null));
      return undefined;
    }

    let objectUrl;
    let audio;
    try {
      objectUrl = URL.createObjectURL(file);
      audio = new Audio();
    } catch {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPlayback({ ...initialState(file), status: 'error', error: 'This browser could not prepare the selected MP3. Try another file.' });
      return undefined;
    }

    audio.preload = 'metadata';
    audioRef.current = audio;
    setPlayback(initialState(file));

    const onLoadStart = () => setPlayback((state) => ({ ...state, status: 'loading', error: '' }));
    const onLoadedMetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setPlayback((state) => ({ ...state, duration, currentTime: audio.currentTime || 0, status: 'paused', error: '' }));
    };
    const onDurationChange = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setPlayback((state) => ({ ...state, duration }));
    };
    const onTimeUpdate = () => {
      setPlayback((state) => ({ ...state, currentTime: audio.currentTime }));
    };
    const onPlay = () => setPlayback((state) => ({ ...state, status: 'playing', error: '' }));
    const onPause = () => setPlayback((state) => state.status === 'ended' ? state : { ...state, status: 'paused' });
    const onEnded = () => setPlayback((state) => ({ ...state, status: 'ended', currentTime: audio.duration || state.currentTime }));
    const onError = () => setPlayback((state) => ({
      ...state,
      status: 'error',
      error: 'This MP3 could not be loaded or decoded. Try another MP3 file.',
    }));

    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.src = objectUrl;
    audio.load();

    return () => {
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      if (audioRef.current === audio) audioRef.current = null;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }

    if (audio.ended) audio.currentTime = 0;
    try {
      await audio.play();
    } catch {
      if (audioRef.current !== audio) return;
      setPlayback((state) => ({
        ...state,
        status: 'error',
        error: 'Playback could not start. Try playing this MP3 again or choose another file.',
      }));
    }
  }, []);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const nextTime = Math.max(0, Math.min(Number(time) || 0, audio.duration));
    audio.currentTime = nextTime;
    setPlayback((state) => ({ ...state, currentTime: audio.currentTime }));
  }, []);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = !audio.paused && !audio.ended;
    audio.currentTime = 0;
    setPlayback((state) => ({ ...state, currentTime: audio.currentTime, status: wasPlaying ? 'playing' : 'paused' }));
    if (!wasPlaying) audio.pause();
  }, []);

  const getCurrentTime = useCallback(() => audioRef.current?.currentTime ?? 0, []);

  return {
    ...playback,
    audioRef,
    getCurrentTime,
    togglePlayback,
    seek,
    restart,
  };
}
