import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { benches } from '../src/benches/benchConfig.js';
import { generateBenchQrSvg } from '../src/benches/generateQr.js';

const baseUrl = process.env.FOOTBEAT_BASE_URL || 'http://localhost:5173';
const outputDirectory = resolve('artifacts/bench-qrs');
await mkdir(outputDirectory, { recursive: true });

for (const bench of benches) {
  const { url, svg } = await generateBenchQrSvg(bench, baseUrl);
  const outputPath = resolve(outputDirectory, `${bench.id}.svg`);
  await writeFile(outputPath, svg, 'utf8');
  console.log(`${bench.id}: ${url} -> ${outputPath}`);
}
