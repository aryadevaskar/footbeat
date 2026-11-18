export default function InstructionDisplay({ title = 'INSTRUCTION DISPLAY', hint = 'Your next move will appear here', cue = '— —', keyHint = null, state = 'idle' }) {
  return (
    <section className={`instruction-display instruction-display--${state}`} aria-label="Instruction display">
      <div className="display-copy">
        <span className="display-eyebrow"><span className="display-dot" /> {title}</span>
        <span className="display-hint">{hint}</span>
      </div>
      <div className="display-cue">{cue}{keyHint && <kbd className="display-key">{keyHint}</kbd>}</div>
      <div className="display-mark" aria-hidden="true">FB<span> / 01</span></div>
    </section>
  );
}
