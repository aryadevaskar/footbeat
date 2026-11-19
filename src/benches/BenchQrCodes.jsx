import { useEffect, useState } from 'react';
import { benches } from './benchConfig.js';
import { generateBenchQrSvg } from './generateQr.js';

export default function BenchQrCodes() {
  const [codes, setCodes] = useState([]);
  const [error, setError] = useState('');
  const [baseUrl, setBaseUrl] = useState(import.meta.env.VITE_FOOTBEAT_PUBLIC_URL || window.location.origin);

  useEffect(() => {
    let mounted = true;
    setCodes([]);
    setError('');
    Promise.all(benches.map(async (bench) => ({ bench, ...await generateBenchQrSvg(bench, baseUrl) })))
      .then((result) => { if (mounted) setCodes(result); })
      .catch((cause) => { if (mounted) setError(cause.message || 'QR codes could not be generated.'); });
    return () => { mounted = false; };
  }, [baseUrl]);

  const download = (code) => {
    const blob = new Blob([code.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${code.bench.id}.svg`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <section className="audio-stage qr-tools-stage" aria-labelledby="qr-tools-title">
      <a className="audio-back-button" href="/">← <span>Back to development</span></a>
      <div className="audio-stage-heading">
        <p className="eyebrow"><span>DEVELOPMENT UTILITY</span></p>
        <h1 id="qr-tools-title">Bench QR<br /><span>codes.</span></h1>
        <p className="stage-lede">These codes contain permanent bench URLs. The daily genre is resolved by the application when the link opens.</p>
      </div>
      <label className="qr-base-url">QR destination URL
        <input type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://your-footbeat-site.example" />
      </label>
      {error && <p className="audio-message audio-message--error" role="alert">{error}</p>}
      <div className="bench-qr-grid">
        {codes.map((code) => (
          <article className="bench-qr-card" key={code.bench.id}>
            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(code.svg)}`} alt={`QR code for ${code.bench.name}`} />
            <h2>{code.bench.name}</h2>
            <p>{code.bench.location}</p>
            <code>{code.url}</code>
            <button className="tutorial-button tutorial-button--secondary" type="button" onClick={() => download(code)}>Download SVG</button>
          </article>
        ))}
      </div>
    </section>
  );
}
