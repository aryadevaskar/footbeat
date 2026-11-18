import FootbeatDevice from '../../components/FootbeatDevice.jsx';
import InstructionDisplay from '../../components/InstructionDisplay.jsx';
import TutorialButton from './TutorialButton.jsx';

export default function PracticeStage({
  exercise,
  exerciseIndex,
  exerciseCount,
  stepIndex,
  stepCount,
  expectedZone,
  feedback,
  wrongZone,
  onRetry,
  onSkip,
}) {
  const progress = `${stepIndex} of ${stepCount}`;
  const message = feedback === 'correct'
    ? 'That’s it. Nice step.'
    : feedback === 'incorrect'
      ? 'Not quite. Try the highlighted cue again.'
      : 'Press the matching letter on your keyboard.';

  return (
    <section className="tutorial-stage" aria-labelledby="practice-title">
      <div className="stage-heading stage-heading--compact">
        <p className="eyebrow"><span>04</span> &nbsp; GUIDED PRACTICE</p>
        <h2 id="practice-title">Let’s put it<br /><span>into motion.</span></h2>
      </div>
      <div className="practice-shell">
        <div className="practice-info">
          <div className="exercise-label">EXERCISE 0{exerciseIndex + 1} <span>/</span> 0{exerciseCount}</div>
          <h3>{exercise.title}</h3>
          <p>{exercise.description}</p>
          <div className="keyboard-map" aria-label="Keyboard zone controls">
            <span><kbd>Q</kbd> Left front</span><span><kbd>O</kbd> Right front</span>
            <span><kbd>A</kbd> Left rear</span><span><kbd>P</kbd> Right rear</span>
          </div>
          <div className={`practice-feedback${feedback ? ` practice-feedback--${feedback}` : ''}`} role="status" aria-live="polite">
            <span className="feedback-mark" aria-hidden="true">{feedback === 'correct' ? '✓' : feedback === 'incorrect' ? '!' : '↳'}</span>
            <span>{message}</span>
          </div>
          <div className="practice-progress-row">
            <span>PROGRESS</span><span>{progress}</span>
          </div>
          <div className="practice-progress-track" role="progressbar" aria-label="Exercise progress" aria-valuemin="0" aria-valuemax={stepCount} aria-valuenow={stepIndex}>
            <i style={{ width: `${(stepIndex / stepCount) * 100}%` }} />
          </div>
          <div className="practice-actions">
            <TutorialButton variant="secondary" onClick={onRetry}>↺ Retry exercise</TutorialButton>
            <button className="text-button" type="button" onClick={onSkip}>Skip exercise <span aria-hidden="true">→</span></button>
          </div>
        </div>
        <div className="practice-device-wrap">
          <InstructionDisplay
            title={feedback === 'incorrect' ? 'TRY THAT CUE AGAIN' : 'STEP ON'}
            hint={`${expectedZone.side} foot · ${expectedZone.depth.toLowerCase()}`}
            cue={`${expectedZone.side} ${expectedZone.depth}`}
            keyHint={expectedZone.key}
            state={feedback || 'active'}
          />
          <FootbeatDevice
            activeZoneId={expectedZone.id}
            feedbackZoneId={feedback === 'incorrect' ? wrongZone : feedback === 'correct' ? expectedZone.id : null}
            feedbackState={feedback}
          />
          <p className="practice-device-note"><span className="status-light" /> WAITING FOR YOUR STEP</p>
        </div>
      </div>
    </section>
  );
}
