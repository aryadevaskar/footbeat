export function getBeatIntervalRows(beatTimes) {
  return beatTimes.map((timestamp, index) => ({
    beatNumber: index + 1,
    timestamp,
    interval: index === 0 ? null : timestamp - beatTimes[index - 1],
  }));
}

export function getBeatIntervalSummary(beatTimes) {
  const intervals = beatTimes.slice(1).map((time, index) => time - beatTimes[index]);
  if (!intervals.length) {
    return { count: 0, median: null, mean: null, standardDeviation: null, coefficientOfVariation: null };
  }
  const sorted = [...intervals].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + ((interval - mean) ** 2), 0) / intervals.length;
  const standardDeviation = Math.sqrt(variance);
  return {
    count: intervals.length,
    median,
    mean,
    standardDeviation,
    coefficientOfVariation: mean ? standardDeviation / mean : null,
  };
}
