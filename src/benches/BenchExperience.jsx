import { useEffect, useState } from 'react';
import { benches } from './benchConfig.js';
import { loadDailySession } from '../session/loadDailySession.js';
import OnboardingFlow from '../onboarding/OnboardingFlow.jsx';

function BenchMessage({ title, children }) {
  return (
    <section className="tutorial-stage public-session-stage" role="status">
      <p className="eyebrow"><span>FOOTBEAT BENCH</span></p>
      <h1>{title}</h1>
      <p className="stage-lede">{children}</p>
    </section>
  );
}

export function DevelopmentBenchLinks() {
  if (!import.meta.env.DEV) return null;
  return (
    <nav className="development-tools" aria-label="Development tools">
      <span>DEVELOPMENT</span>
      {benches.map((bench) => <a key={bench.id} href={`/bench/${bench.id}`}>{bench.name}</a>)}
      <a href="/dev">Local MP3 tools</a>
      <a href="/dev/qr-codes">Generate bench QR codes</a>
    </nav>
  );
}

export default function BenchExperience({ benchId }) {
  const [resolution, setResolution] = useState({ status: 'loading', session: null, error: '' });

  useEffect(() => {
    let current = true;
    setResolution({ status: 'loading', session: null, error: '' });
    loadDailySession({ benchId })
      .then((session) => { if (current) setResolution({ status: 'ready', session, error: '' }); })
      .catch((error) => { if (current) setResolution({ status: 'error', session: null, error: error.message || 'This bench could not be identified.' }); });
    return () => { current = false; };
  }, [benchId]);

  if (resolution.status === 'loading') return <BenchMessage title="Connecting to this bench…">Loading its location and today’s music schedule.</BenchMessage>;
  if (!resolution.session) {
    return <BenchMessage title="We couldn’t find this bench.">{resolution.error} Check the QR code URL and try again.</BenchMessage>;
  }
  return <OnboardingFlow key={benchId} session={resolution.session} />;
}

export function ScanRequired() {
  return <BenchMessage title="Scan a FOOTBEAT bench QR code.">Each bench has its own permanent link and daily music schedule. Scan the code on the bench to start.</BenchMessage>;
}
