const STORAGE_PREFIX = 'footbeat:onboarding-complete:';

function completionKey(benchId) {
  return typeof benchId === 'string' && benchId.length > 0
    ? `${STORAGE_PREFIX}${encodeURIComponent(benchId)}`
    : null;
}

export function hasCompletedOnboarding(benchId, storage) {
  const key = completionKey(benchId);
  if (!key) return false;
  try {
    const targetStorage = storage ?? globalThis.localStorage;
    return targetStorage?.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function markOnboardingComplete(benchId, storage) {
  const key = completionKey(benchId);
  if (!key) return false;
  try {
    const targetStorage = storage ?? globalThis.localStorage;
    if (!targetStorage) return false;
    targetStorage.setItem(key, 'true');
    return true;
  } catch {
    return false;
  }
}
