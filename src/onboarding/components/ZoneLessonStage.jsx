import FootbeatDevice from '../../components/FootbeatDevice.jsx';
import InstructionDisplay from '../../components/InstructionDisplay.jsx';
import TutorialButton from './TutorialButton.jsx';

export default function ZoneLessonStage({ zone, index, total, onPrevious, onNext }) {
  return (
    <section className="tutorial-stage" aria-labelledby="zones-title">
      <div className="stage-heading stage-heading--compact">
        <p className="eyebrow"><span>03</span> &nbsp; LEARN THE ZONES</p>
        <h2 id="zones-title">Know your<br /><span>landing spots.</span></h2>
        <p className="stage-lede">Each platform has a front and a rear zone.</p>
      </div>
      <div className="zone-lesson-layout">
        <div className="zone-lesson-copy" aria-live="polite">
          <div className="zone-lesson-count">ZONE 0{index + 1} <span>/</span> 0{total}</div>
          <div className="lesson-zone-name"><span>{zone.side}</span><span>{zone.depth}</span></div>
          <p>Step with your <strong>{zone.foot.toLowerCase()}</strong> on {zone.placement}.</p>
          <div className="zone-lesson-meter" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => <i className={i <= index ? 'is-lit' : ''} key={i} />)}
          </div>
        </div>
        <div className="zone-lesson-device">
          <InstructionDisplay title="ZONE TO LEARN" hint={`${zone.foot} · ${zone.depth.toLowerCase()}`} cue={`${zone.side} ${zone.depth}`} state="active" />
          <FootbeatDevice activeZoneId={zone.id} />
        </div>
      </div>
      <div className="stage-actions stage-actions--split">
        {index > 0 ? <TutorialButton variant="secondary" onClick={onPrevious}>← Previous</TutorialButton> : <span />}
        <TutorialButton onClick={onNext}>{index === total - 1 ? 'Start practice' : 'Next zone'}</TutorialButton>
      </div>
    </section>
  );
}
