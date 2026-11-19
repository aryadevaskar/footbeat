import test from 'node:test';
import assert from 'node:assert/strict';
import { hasCompletedOnboarding, markOnboardingComplete } from './tutorialPersistence.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('onboarding completion persists independently for each bench', () => {
  const storage = createStorage();
  assert.equal(hasCompletedOnboarding('newcastle-bench-001', storage), false);
  assert.equal(markOnboardingComplete('newcastle-bench-001', storage), true);
  assert.equal(hasCompletedOnboarding('newcastle-bench-001', storage), true);
  assert.equal(hasCompletedOnboarding('newcastle-bench-002', storage), false);
});

test('persistence failures do not block onboarding or expose untrusted IDs', () => {
  const blockedStorage = {
    getItem() { throw new Error('storage is unavailable'); },
    setItem() { throw new Error('storage is unavailable'); },
  };
  assert.equal(hasCompletedOnboarding('bench', blockedStorage), false);
  assert.equal(markOnboardingComplete('bench', blockedStorage), false);
  assert.equal(markOnboardingComplete('', createStorage()), false);
});
