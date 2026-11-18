import { zones } from '../data/zones.js';
import PressureZone from './PressureZone.jsx';

export default function FootbeatDevice({ activeZoneId = null, selectedZoneId = null, transitionZoneId = null, feedbackZoneId = null, feedbackState = null }) {
  return (
    <div className={`device-frame${activeZoneId ? ' has-active-zone' : ''}`} role="group" aria-label="Four-zone FOOTBEAT pressure surface">
      <div className="device-topline" aria-hidden="true">
        <span className="hardware-screw" />
        <span className="device-model">FB—04 <span>·</span> PRESSURE ARRAY</span>
        <span className="hardware-screw" />
      </div>
      <div className="device-platforms">
        {['left', 'right'].map((side) => (
          <div className={`platform platform--${side}`} key={side}>
            {zones.filter((zone) => zone.side.toLowerCase() === side).map((zone) => (
              <PressureZone
                key={zone.id}
                id={zone.id}
                side={zone.side}
                depth={zone.depth}
                position={zone.position}
                active={activeZoneId === zone.id}
                selected={selectedZoneId === zone.id}
                transitioning={transitionZoneId === zone.id}
                feedback={feedbackZoneId === zone.id ? feedbackState : null}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="device-bottomline" aria-hidden="true">
        <span>LEFT PLATFORM</span><span className="device-center-mark">●</span><span>RIGHT PLATFORM</span>
      </div>
    </div>
  );
}
