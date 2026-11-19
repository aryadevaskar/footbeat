import TutorialButton from '../../onboarding/components/TutorialButton.jsx';
import { getGenre } from '../../catalogue/genres.js';

export default function TodayGenreStage({ session, onContinue, onBack }) {
  const genre = getGenre(session.genre);
  return (
    <section className="tutorial-stage public-session-stage" aria-labelledby="today-genre-title">
      <p className="eyebrow"><span>TODAY AT THIS BENCH</span></p>
      <div className="stage-heading">
        <h1 id="today-genre-title">{genre.label}<br /><span>for today.</span></h1>
        <p className="stage-lede">{genre.description} Choose a track from today’s selection and get ready to move.</p>
      </div>
      <dl className="bench-context-list">
        <div><dt>BENCH</dt><dd>{session.bench.name}</dd></div>
        <div><dt>LOCATION</dt><dd>{session.bench.location}</dd></div>
        <div><dt>LOCAL DATE</dt><dd><time dateTime={session.localDate}>{session.localDate}</time></dd></div>
      </dl>
      <div className="stage-actions stage-actions--split">
        <TutorialButton variant="secondary" onClick={onBack}>← Back to tutorial</TutorialButton>
        <TutorialButton onClick={onContinue}>See today’s songs <span aria-hidden="true">→</span></TutorialButton>
      </div>
    </section>
  );
}
