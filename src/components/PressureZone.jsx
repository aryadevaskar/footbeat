export default function PressureZone({ id, side, depth, position, active = false, selected = false, transitioning = false, feedback }) {
  const feedbackClass = feedback ? ` pressure-zone--${feedback}` : '';
  const stateLabel = feedback === 'correct'
    ? 'REGISTERED'
    : feedback === 'incorrect'
      ? 'WRONG ZONE'
      : active
        ? 'STEP HERE'
          : selected
            ? 'SELECTED'
            : '';
  const stateDescription = feedback === 'correct'
    ? ', input registered'
    : feedback === 'incorrect'
      ? ', incorrect input'
      : active
        ? ', current instruction'
          : selected
            ? ', selected movement'
            : '';

  return (
    <div
      className={`pressure-zone pressure-zone--${position}${active ? ' is-active' : ''}${selected ? ' is-selected' : ''}${transitioning ? ' is-preview-transition' : ''}${feedbackClass}`}
      role="img"
      aria-label={`${side.toLowerCase()} ${depth.toLowerCase()} pressure zone${stateDescription}`}
      data-zone-state={feedback || (active ? 'instruction' : selected ? 'selected' : 'idle')}
      data-zone-id={id}
    >
      <span className="zone-index" aria-hidden="true">{position === 'front' ? '01' : '02'}</span>
      <span className="zone-label">
        <span className="zone-side">{side}</span>
        <span className="zone-depth">{depth}</span>
      </span>
      {stateLabel && <span className="zone-state-label" aria-hidden="true">{stateLabel}</span>}
      <span className="zone-indicator" aria-hidden="true" />
    </div>
  );
}
