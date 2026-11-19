const week = (monday, tuesday, wednesday, thursday, friday, saturday, sunday) => ({
  monday, tuesday, wednesday, thursday, friday, saturday, sunday,
});

export const benches = [
  {
    id: 'newcastle-bench-001',
    name: 'Central Bench',
    location: 'Newcastle upon Tyne',
    timezone: 'Europe/London',
    genreSchedule: week('indie', 'electronic', 'hip-hop', 'pop', 'indie', 'electronic', 'pop'),
  },
  {
    id: 'newcastle-bench-002',
    name: 'Quayside Bench',
    location: 'Newcastle Quayside',
    timezone: 'Europe/London',
    genreSchedule: week('electronic', 'pop', 'indie', 'hip-hop', 'electronic', 'pop', 'hip-hop'),
  },
  {
    id: 'newcastle-bench-003',
    name: 'Ouseburn Bench',
    location: 'Ouseburn, Newcastle',
    timezone: 'Europe/London',
    genreSchedule: week('hip-hop', 'indie', 'pop', 'electronic', 'hip-hop', 'indie', 'electronic'),
  },
];

export const DEFAULT_DEVELOPMENT_BENCH_ID = import.meta.env?.VITE_DEV_BENCH_ID || benches[0].id;

export function getBenchById(benchId, configuredBenches = benches) {
  return configuredBenches.find((bench) => bench.id === benchId) ?? null;
}
