import FootbeatDevice from '../../components/FootbeatDevice.jsx';
import InstructionDisplay from '../../components/InstructionDisplay.jsx';
import TutorialButton from './TutorialButton.jsx';

export default function WelcomeStage({ onBegin, onExplore }) {
  return (
    <section className="welcome-stage tutorial-stage" aria-labelledby="welcome-title">
      <div className="welcome-copy">
        <p className="eyebrow"><span>01</span> &nbsp; A NEW WAY TO PLAY</p>
        <h1 id="welcome-title">Find your<br /><span>rhythm.</span></h1>
        <p className="stage-lede">A rhythm game played with your feet. Listen, follow the cues, and find your flow.</p>
        <p className="supporting-copy">Use four pressure zones to follow musical instructions. We’ll show you how, one easy step at a time.</p>
        <div className="welcome-actions">
          <TutorialButton onClick={onBegin}>Let’s begin</TutorialButton>
          <TutorialButton variant="secondary" onClick={onExplore}>Explore Newcastle</TutorialButton>
        </div>
      </div>
      <div className="welcome-visual" aria-label="A preview of the four FOOTBEAT pressure zones">
        <InstructionDisplay title="YOUR NEXT MOVE" hint="A cue will appear here" cue="· ·" />
        <FootbeatDevice />
        <div className="welcome-footnote"><span className="caption-mark">✳</span> FOUR ZONES. YOUR WHOLE FLOOR.</div>
      </div>
    </section>
  );
}
