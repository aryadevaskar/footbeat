const BENCH_ROUTE = /^\/bench\/([a-z0-9][a-z0-9-]*)\/?$/i;
const BENCH_ID = /^[a-z0-9][a-z0-9-]*$/;

export function parseBenchRoute(pathname) {
  const match = BENCH_ROUTE.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]).toLowerCase();
  } catch {
    return null;
  }
}

export function createBenchUrl(benchId, baseUrl = globalThis.location?.origin || 'http://localhost:5173') {
  if (typeof benchId !== 'string' || !BENCH_ID.test(benchId)) {
    throw new TypeError('Bench IDs must use lowercase letters, numbers, and hyphens.');
  }
  let base;
  try {
    base = new URL(baseUrl);
  } catch {
    throw new TypeError('Enter a valid website URL for the QR code destination.');
  }
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new TypeError('QR code destinations must use HTTP or HTTPS.');
  }
  return new URL(`/bench/${encodeURIComponent(benchId)}`, base).toString();
}
