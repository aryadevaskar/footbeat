import QRCode from 'qrcode';
import { createBenchUrl } from './benchRoute.js';

export async function generateBenchQrSvg(bench, baseUrl, options = {}) {
  if (!bench?.id) throw new TypeError('A configured bench is required to generate its QR code.');
  const url = createBenchUrl(bench.id, baseUrl);
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'Q',
    margin: 2,
    width: 640,
    color: { dark: '#080808', light: '#ffffff' },
    ...options,
  });
  return { url, svg };
}
