import { DEFAULT_DEVELOPMENT_BENCH_ID } from './benches/benchConfig.js';
import { parseBenchRoute } from './benches/benchRoute.js';

export function resolveAppRoute(pathname, isDevelopment, defaultBenchId = DEFAULT_DEVELOPMENT_BENCH_ID) {
  const benchId = parseBenchRoute(pathname);
  if (benchId) return { type: 'bench', benchId };
  if (pathname === '/dev/qr-codes' && isDevelopment) return { type: 'qr-tools' };
  if (pathname === '/dev' && isDevelopment) return { type: 'developer-tools' };
  if (pathname === '/' && isDevelopment) return { type: 'bench', benchId: defaultBenchId };
  if (pathname === '/') return { type: 'scan-required' };
  return { type: 'not-found' };
}
