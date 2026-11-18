import { useCallback, useEffect, useRef, useState } from 'react';
import { zones } from '../data/zones.js';
import CompletionStage from './components/CompletionStage.jsx';
import PracticeStage from './components/PracticeStage.jsx';
import SongExperience from '../audio/SongExperience.jsx';
import TutorialProgress from './components/TutorialProgress.jsx';
import UnderstandingStage from './components/UnderstandingStage.jsx';
import WelcomeStage from './components/WelcomeStage.jsx';
import ZoneLessonStage from './components/ZoneLessonStage.jsx';
import { practiceExercises, tutorialStages } from './data/tutorial.js';
import usePracticeInput from './hooks/usePracticeInput.js';

const zoneById = Object.fromEntries(zones.map((zone) => [zone.id, zone]));

export default function OnboardingFlow() {
  const [stage, setStage] = useState('welcome');
  const [zoneIndex, setZoneIndex] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [wrongZone, setWrongZone] = useState(null);
  const advanceTimer = useRef(null);
  const exercise = practiceExercises[exerciseIndex];
  const expectedZone = zoneById[exercise.sequence[Math.min(stepIndex, exercise.sequence.length - 1)]];

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  useEffect(() => clearAdvanceTimer, [clearAdvanceTimer]);

  const beginPractice = useCallback(() => {
    clearAdvanceTimer();
    setExerciseIndex(0);
    setStepIndex(0);
    setFeedback('');
    setWrongZone(null);
    setStage('practice');
  }, [clearAdvanceTimer]);

  const finishPractice = useCallback(() => {
    clearAdvanceTimer();
    setFeedback('');
    setWrongZone(null);
    setStage('complete');
  }, [clearAdvanceTimer]);

  const advanceExercise = useCallback(() => {
    clearAdvanceTimer();
    setFeedback('');
    setWrongZone(null);
    if (exerciseIndex + 1 < practiceExercises.length) {
      setExerciseIndex((index) => index + 1);
      setStepIndex(0);
    } else {
      setStage('complete');
    }
  }, [clearAdvanceTimer, exerciseIndex]);

  const handleZoneKey = useCallback((zoneId) => {
    if (stage !== 'practice' || feedback === 'correct') return;
    clearAdvanceTimer();
    if (zoneId !== expectedZone.id) {
      setFeedback('incorrect');
      setWrongZone(zoneId);
      return;
    }

    setFeedback('correct');
    setWrongZone(null);
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null;
      setFeedback('');
      const nextStep = stepIndex + 1;
      if (nextStep < exercise.sequence.length) {
        setStepIndex(nextStep);
      } else if (exerciseIndex + 1 < practiceExercises.length) {
        setExerciseIndex((index) => index + 1);
        setStepIndex(0);
      } else {
        setStage('complete');
      }
    }, 620);
  }, [stage, feedback, clearAdvanceTimer, expectedZone.id, stepIndex, exercise.sequence.length, exerciseIndex]);

  usePracticeInput(stage === 'practice', handleZoneKey);

  const selectStage = (nextStage) => {
    clearAdvanceTimer();
    if (nextStage === 'practice' && stage !== 'practice') {
      setExerciseIndex(0);
      setStepIndex(0);
    }
    setFeedback('');
    setWrongZone(null);
    setStage(nextStage);
  };

  const retryExercise = () => {
    clearAdvanceTimer();
    setStepIndex(0);
    setFeedback('');
    setWrongZone(null);
  };

  const visibleStage = stage === 'song' ? 'complete' : stage;
  const stageNumber = tutorialStages.findIndex((item) => item.id === visibleStage) + 1;

  if (stage === 'song') {
    return (
      <div className="onboarding-shell">
        <SongExperience onBack={() => setStage('complete')} />
      </div>
    );
  }

  let stageContent;
  if (stage === 'welcome') {
    stageContent = <WelcomeStage onBegin={() => setStage('understand')} />;
  } else if (stage === 'understand') {
    stageContent = <UnderstandingStage onContinue={() => { setZoneIndex(0); setStage('zones'); }} />;
  } else if (stage === 'zones') {
    stageContent = (
      <ZoneLessonStage
        zone={zones[zoneIndex]}
        index={zoneIndex}
        total={zones.length}
        onPrevious={() => setZoneIndex((index) => Math.max(0, index - 1))}
        onNext={() => {
          if (zoneIndex + 1 < zones.length) setZoneIndex((index) => index + 1);
          else beginPractice();
        }}
      />
    );
  } else if (stage === 'practice') {
    stageContent = (
      <PracticeStage
        exercise={exercise}
        exerciseIndex={exerciseIndex}
        exerciseCount={practiceExercises.length}
        stepIndex={stepIndex}
        stepCount={exercise.sequence.length}
        expectedZone={expectedZone}
        feedback={feedback}
        wrongZone={wrongZone}
        onRetry={retryExercise}
        onSkip={advanceExercise}
      />
    );
  } else if (stage === 'complete') {
    stageContent = <CompletionStage onChooseSong={() => setStage('song')} />;
  }

  return (
    <div className="onboarding-shell">
      <TutorialProgress current={stage} onSelect={selectStage} />
      <div className="stage-meta"><span>YOUR FIRST SESSION</span><span>{String(stageNumber).padStart(2, '0')} <i>/</i> 05</span></div>
      <div className="stage-content" key={stage}>
        {stageContent}
      </div>
    </div>
  );
}
