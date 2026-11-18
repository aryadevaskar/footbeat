import FootbeatDevice from '../../components/FootbeatDevice.jsx';
import InstructionDisplay from '../../components/InstructionDisplay.jsx';
import { zones, zoneIds } from '../../data/zones.js';
import TutorialButton from './TutorialButton.jsx';

const steps = [
  ['01', 'Listen', 'The music sets the pace.'],
  ['02', 'Watch', 'A cue appears up top.'],
  ['03', 'Find', 'Spot the highlighted zone.'],
  ['04', 'Step', 'Move onto that zone.'],
  ['05', 'Flow', 'Follow along to build a streak.'],
];

export default function UnderstandingStage({ onContinue }) {
  const demoZone = zones.find((zone) => zone.id === zoneIds.leftFront);

  return (
    <section className="tutorial-stage" aria-labelledby="understand-title">
      <div className="stage-heading">
        <p className="eyebrow"><span>02</span> &nbsp; THE BASICS</p>
        <h2 id="understand-title">A cue. A step.<br /><span>That’s the flow.</span></h2>
        <p className="stage-lede">Follow the signal from screen to floor.</p>
      </div>
      <div className="demo-layout">
        <div className="demo-sequence" aria-label="How to play, in five steps">
          {steps.map(([number, title, copy], index) => (
            <div className={`demo-step${index === 2 ? ' demo-step--focus' : ''}`} key={number}>
              <span className="demo-step-number">{number}</span>
              <div><strong>{title}</strong><span>{copy}</span></div>
              {index < steps.length - 1 && <span className="demo-connector" aria-hidden="true" />}
            </div>
          ))}
        </div>
        <div className="demo-device">
          <InstructionDisplay title="NEXT STEP" hint="Try the highlighted zone" cue={`${demoZone.side} ${demoZone.depth}`} keyHint={demoZone.key} state="active" />
          <FootbeatDevice activeZoneId={demoZone.id} />
          <p className="demo-caption">SCREEN CUE <span>→</span> FOOT ZONE</p>
        </div>
      </div>
      <div className="stage-actions"><TutorialButton onClick={onContinue}>Continue</TutorialButton></div>
    </section>
  );
}
