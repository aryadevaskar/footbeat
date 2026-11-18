import { useState } from 'react';
import AudioPlayerScreen from './AudioPlayerScreen.jsx';
import AnalysisResultsScreen from './AnalysisResultsScreen.jsx';
import SongSelectionScreen from './SongSelectionScreen.jsx';
import useAudioPlayer from './useAudioPlayer.js';
import useLocalAudioFile from './useLocalAudioFile.js';
import useRhythmAnalysis from './useRhythmAnalysis.js';

export default function SongExperience({ onBack }) {
  const [screen, setScreen] = useState('selection');
  const { track, fileError, selectFile, clearFileError } = useLocalAudioFile();
  const playback = useAudioPlayer(screen === 'player' || screen === 'results' ? track?.file : null);
  const analysis = useRhythmAnalysis();

  const handleChooseFile = (file) => {
    clearFileError();
    if (selectFile(file)) analysis.reset();
  };

  const handleAnalyse = async () => {
    const result = await analysis.analyse(track.file);
    if (!result) return;
    playback.audioRef.current?.pause();
    setScreen('results');
  };

  const returnToSelection = () => {
    analysis.reset();
    setScreen('selection');
  };

  if (screen === 'results' && analysis.result) {
    return <AnalysisResultsScreen result={analysis.result} playback={playback} onBack={() => setScreen('player')} />;
  }

  if (screen === 'player' && track) {
    return (
      <AudioPlayerScreen
        track={track}
        playback={playback}
        analysisStatus={analysis.status}
        analysisError={analysis.error}
        hasAnalysis={Boolean(analysis.result)}
        onAnalyse={handleAnalyse}
        onViewAnalysis={() => setScreen('results')}
        onBack={returnToSelection}
      />
    );
  }

  return (
    <SongSelectionScreen
      track={track}
      error={fileError}
      onChooseFile={handleChooseFile}
      onContinue={() => { if (track) setScreen('player'); }}
      onBack={onBack}
    />
  );
}
