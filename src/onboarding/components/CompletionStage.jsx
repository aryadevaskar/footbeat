import FootbeatDevice from '../../components/FootbeatDevice.jsx';
import TutorialButton from './TutorialButton.jsx';

export default function CompletionStage({ onChooseSong }) {
  return (
    <section className="tutorial-stage completion-stage" aria-labelledby="complete-title">
      <div className="completion-copy">
        <p className="eyebrow"><span>05</span> &nbsp; TUTORIAL COMPLETE</p>
        <div className="completion-stamp" aria-hidden="true">✓</div>
        <h1 id="complete-title">You’re ready<br /><span>to move.</span></h1>
        <p className="stage-lede">You’ve learned all four zones. Now you’re ready to try a song and find your own rhythm.</p>
        <TutorialButton onClick={onChooseSong}>Choose a song</TutorialButton>
      </div>
      <div className="completion-device"><FootbeatDevice /></div>
    </section>
  );
}
