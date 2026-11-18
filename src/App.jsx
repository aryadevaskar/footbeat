import OnboardingFlow from './onboarding/OnboardingFlow.jsx';

export default function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#home" aria-label="Footbeat home">
          <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>FOOT<span className="wordmark-accent">BEAT</span></span>
        </a>
        <div className="prototype-status"><span className="status-light" /> BROWSER PROTOTYPE</div>
      </header>
      <OnboardingFlow />
      <footer className="footer-note"><span>FOOTBEAT / FIELD TEST 001</span><span>MADE FOR MOVEMENT <span aria-hidden="true">↗</span></span></footer>
    </main>
  );
}
