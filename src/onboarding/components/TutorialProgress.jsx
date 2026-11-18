import { tutorialStages } from '../data/tutorial.js';

export default function TutorialProgress({ current, onSelect }) {
  const visibleStage = current === 'song' ? 'complete' : current;

  return (
    <nav className="tutorial-progress" aria-label="Tutorial stages">
      {tutorialStages.map((stage, index) => {
        const selected = stage.id === visibleStage;
        return (
          <button
            className={`progress-step${selected ? ' is-current' : ''}`}
            type="button"
            key={stage.id}
            aria-current={selected ? 'step' : undefined}
            onClick={() => onSelect(stage.id)}
          >
            <span className="progress-number">0{index + 1}</span>
            <span className="progress-label">{stage.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
