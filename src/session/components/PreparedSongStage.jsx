import { useEffect, useState } from 'react';
import TutorialButton from '../../onboarding/components/TutorialButton.jsx';
import useAudioPlayer from '../../audio/useAudioPlayer.js';
import { checkPreparedSongAssets, loadPreparedBeatmap } from '../../catalogue/prepareSong.js';
import LiveGameplayCue from './LiveGameplayCue.jsx';

export default function PreparedSongStage({ song, bench, onBack, onExplore }) {
  const playback = useAudioPlayer(song.audioAssetPath);
  const { togglePlayback, audioRef } = playback;
  const [assetState, setAssetState] = useState({ status: 'loading', beatmap: null, error: '' });
  const [phase, setPhase] = useState('ready');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let current = true;
    setAssetState({ status: 'loading', beatmap: null, error: '' });
    Promise.all([checkPreparedSongAssets(song), loadPreparedBeatmap(song)])
      .then(([, beatmap]) => {
        if (current) setAssetState({ status: 'ready', beatmap, error: '' });
      })
      .catch((error) => {
        if (current) setAssetState({ status: 'error', beatmap: null, error: error.message || 'Song preparation failed.' });
      });
    return () => { current = false; };
  }, [song]);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    const timer = window.setTimeout(async () => {
      if (countdown > 1) {
        setCountdown((value) => value - 1);
        return;
      }
      await togglePlayback();
      setPhase(audioRef.current?.paused ? 'ready' : 'playing');
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, togglePlayback, audioRef]);

  useEffect(() => {
    if (playback.status === 'error' && phase === 'playing') setPhase('ready');
  }, [playback.status, phase]);

  const canStart = assetState.status === 'ready' && playback.duration > 0 && playback.status !== 'error';
  const startCountdown = () => {
    setCountdown(3);
    setPhase('countdown');
  };

  return (
    <section className="tutorial-stage preparation-stage" aria-labelledby="preparation-title">
      <button className="audio-back-button" type="button" onClick={onBack}>← <span>Back to songs</span></button>
      <p className="eyebrow"><span>{bench.name}</span> · GAMEPLAY PREPARATION</p>
      <h1 id="preparation-title">{phase === 'playing' ? 'Track started.' : phase === 'countdown' ? 'Get ready.' : 'Your track is ready.'}</h1>
      <p className="stage-lede">{song.title} · {song.artist}</p>

      {assetState.status === 'loading' && <p className="audio-message" role="status">Loading the song and its prepared beatmap…</p>}
      {assetState.status === 'error' && <p className="audio-message audio-message--error" role="alert">{assetState.error}</p>}
      {playback.status === 'loading' && assetState.status === 'ready' && <p className="audio-message" role="status">Reading audio duration…</p>}
      {playback.error && <p className="audio-message audio-message--error" role="alert">{playback.error}</p>}

      {assetState.status === 'ready' && (
        <div className="preparation-summary" aria-live="polite">
          <div><span>BEATS IN MAP</span><strong>{assetState.beatmap.beatCount}</strong></div>
          <div><span>FOOT MOVEMENTS</span><strong>{assetState.beatmap.steps.length}</strong></div>
          <div><span>SONG DURATION</span><strong>{playback.duration ? `${Math.floor(playback.duration / 60)}:${Math.floor(playback.duration % 60).toString().padStart(2, '0')}` : '—'}</strong></div>
        </div>
      )}

      {phase === 'countdown' && <div className="session-countdown" role="timer" aria-live="assertive">{countdown}</div>}
      {phase === 'playing' && assetState.beatmap && <LiveGameplayCue beatmap={assetState.beatmap} audioRef={audioRef} />}

      <div className="stage-actions stage-actions--split">
        <TutorialButton variant="secondary" onClick={onBack}>Choose another song</TutorialButton>
        {phase === 'playing' ? (
          <button className="tutorial-button tutorial-button--primary" type="button" onClick={togglePlayback}>
            {playback.status === 'playing' ? 'Pause track' : playback.status === 'ended' ? 'Play again' : 'Resume track'}
          </button>
        ) : (
          <TutorialButton onClick={startCountdown} disabled={!canStart || phase === 'countdown'}>
            {phase === 'countdown' ? 'Starting…' : 'Start countdown'}
          </TutorialButton>
        )}
      </div>
      {phase === 'playing' && playback.status === 'ended' && (
        <div className="explore-session-action">
          <p>The session is complete. Take a look around Newcastle.</p>
          <TutorialButton variant="secondary" onClick={onExplore}>Explore Newcastle</TutorialButton>
        </div>
      )}
    </section>
  );
}
