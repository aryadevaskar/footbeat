import { DIFFICULTY_OPTIONS } from '../difficultyRules.js';

export default function ChoreographyControls({ difficulty, onDifficultyChange, onGenerate, error, generated, canPreview, isPreviewing, onTogglePreview }) {
  return (
    <section className="choreography-controls" aria-labelledby="choreography-controls-title">
      <div className="choreography-controls-copy">
        <p className="section-label">FROM BEATS TO MOVEMENT</p>
        <h2 id="choreography-controls-title">Build a beatmap</h2>
        <p>Turn detected beats into a footwork sequence. Every move stays on an actual detected beat.</p>
      </div>
      <div className="choreography-control-actions">
        <label htmlFor="choreography-difficulty">DIFFICULTY</label>
        <select id="choreography-difficulty" value={difficulty} onChange={(event) => onDifficultyChange(event.target.value)}>
          {DIFFICULTY_OPTIONS.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
        </select>
        <button className="generate-beatmap-button" type="button" onClick={onGenerate}>
          {generated ? 'Regenerate beatmap' : 'Generate beatmap'} <span aria-hidden="true">↗</span>
        </button>
        {generated && <button className="preview-beatmap-button" type="button" onClick={onTogglePreview} disabled={!canPreview} aria-pressed={isPreviewing}>
          <span aria-hidden="true">{isPreviewing ? 'Ⅱ' : '▶'}</span> {isPreviewing ? 'Pause preview' : 'Preview choreography'}
        </button>}
      </div>
      {error && <p className="beatmap-error" role="alert">{error}</p>}
    </section>
  );
}
