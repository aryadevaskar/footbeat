import { lazy, Suspense } from 'react';
import BenchExperience, { DevelopmentBenchLinks, ScanRequired } from './benches/BenchExperience.jsx';
import { resolveAppRoute } from './appRoute.js';

const BenchQrCodes = lazy(() => import('./benches/BenchQrCodes.jsx'));
const SongExperience = lazy(() => import('./audio/SongExperience.jsx'));

function NotFound() {
  return <section className="tutorial-stage public-session-stage"><h1>Page not found.</h1><p className="stage-lede">Open a FOOTBEAT bench QR link to start a session.</p></section>;
}

export default function App() {
  const route = resolveAppRoute(window.location.pathname, import.meta.env.DEV);
  let page;

  if (route.type === 'bench') page = <BenchExperience benchId={route.benchId} />;
  else if (route.type === 'scan-required') page = <ScanRequired />;
  else if (route.type === 'developer-tools') page = import.meta.env.DEV ? <Suspense fallback={<p className="audio-message">Loading developer tools…</p>}><SongExperience onBack={() => { window.location.href = '/'; }} /></Suspense> : <NotFound />;
  else if (route.type === 'qr-tools') page = import.meta.env.DEV ? <Suspense fallback={<p className="audio-message">Preparing bench QR codes…</p>}><BenchQrCodes /></Suspense> : <NotFound />;
  else page = <NotFound />;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Footbeat home">
          <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>FOOT<span className="wordmark-accent">BEAT</span></span>
        </a>
        <div className="prototype-status"><span className="status-light" /> {route.type === 'developer-tools' || route.type === 'qr-tools' ? 'DEVELOPER TOOLS' : 'BROWSER PROTOTYPE'}</div>
      </header>
      <DevelopmentBenchLinks />
      {page}
      <footer className="footer-note"><span>FOOTBEAT / FIELD TEST 001</span><span>MADE FOR MOVEMENT <span aria-hidden="true">↗</span></span></footer>
    </main>
  );
}
