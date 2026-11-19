export function findActiveCueIndex(steps, currentTime) {
  let low = 0;
  let high = steps.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (steps[middle].timestamp <= currentTime) low = middle + 1;
    else high = middle;
  }
  return low - 1;
}
