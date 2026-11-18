import { zones } from '../data/zones.js';
import { createBeatmap } from './beatmapModel.js';
import { DIFFICULTY_RULES } from './difficultyRules.js';

const zoneById = new Map(zones.map((zone) => [zone.id, zone]));

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeBeats(beatTimes, duration) {
  if (!Array.isArray(beatTimes)) {
    throw new TypeError('beatTimes must be an array of detected timestamps.');
  }

  const invalidCount = beatTimes.filter((time) => (
    typeof time !== 'number' || !Number.isFinite(time) || time < 0 || time > duration
  )).length;
  const validTimes = beatTimes
    .filter((time) => typeof time === 'number' && Number.isFinite(time) && time >= 0 && time <= duration)
    .sort((a, b) => a - b);
  const uniqueTimes = validTimes.filter((time, index) => index === 0 || time !== validTimes[index - 1]);

  return {
    beats: uniqueTimes.map((timestamp, beatIndex) => ({ timestamp, beatIndex })),
    invalidCount,
    duplicateCount: validTimes.length - uniqueTimes.length,
  };
}

function inferBeatInterval(beats, estimatedBpm) {
  if (Number.isFinite(estimatedBpm) && estimatedBpm > 0) return 60 / estimatedBpm;
  const intervals = beats.slice(1).map((beat, index) => beat.timestamp - beats[index].timestamp).filter((gap) => gap > 0);
  if (!intervals.length) return 0;
  intervals.sort((a, b) => a - b);
  return intervals[Math.floor(intervals.length / 2)];
}

function shouldLeaveBeatEmpty(beatIndex, rules) {
  return rules.skipEveryBeats > 0 && rules.skipOffsets.includes(beatIndex % rules.skipEveryBeats);
}

function eligibleZones({ beat, steps, rules, minimumStepGapSeconds }) {
  const previous = steps.at(-1);
  if (!previous) return zones;

  const elapsed = beat.timestamp - previous.timestamp;
  if (elapsed < minimumStepGapSeconds) return [];

  const valid = zones.filter((zone) => {
    const previousZone = zoneById.get(previous.targetZone);
    const isSameFootDepthSwitch = zone.side === previousZone.side && zone.position !== previousZone.position;
    return !isSameFootDepthSwitch || elapsed >= rules.minimumSameFootDepthSwitchSeconds;
  });

  const nonRepeating = valid.filter((zone) => zone.id !== previous.targetZone);
  return nonRepeating.length ? nonRepeating : valid;
}

function scoreZone(zone, { steps, rules }) {
  const previous = steps.at(-1);
  const recent = steps.slice(-3);
  const history = steps
    .slice(-(rules.maximumPatternPeriod * 2 - 1))
    .map((step) => step.targetZone);
  const proposedSequence = [...history, zone.id];
  let score = 0;

  if (previous?.targetZone === zone.id) score += rules.repeatedZonePenalty;
  if (previous && zone.side === zoneById.get(previous.targetZone).side) score += rules.sameFootPenalty;
  if (recent.some((step) => step.targetZone === zone.id)) score += rules.recentZonePenalty;
  for (let period = 2; period <= rules.maximumPatternPeriod; period += 1) {
    if (proposedSequence.length < period * 2) continue;
    const latestPattern = proposedSequence.slice(-period);
    const previousPattern = proposedSequence.slice(-period * 2, -period);
    if (latestPattern.every((zoneId, index) => zoneId === previousPattern[index])
    ) {
      score += rules.repeatedPatternPenalty;
    }
  }

  const movementCount = steps.length;
  if (zone.position === 'back') {
    if (movementCount < rules.frontOnlyMoves) {
      score += rules.rearPreferencePenalty + rules.repeatedZonePenalty;
    } else if (rules.rearPreferenceEveryMoves > 0) {
      const wantsRear = (movementCount - rules.frontOnlyMoves) % rules.rearPreferenceEveryMoves === 0;
      score += wantsRear ? -rules.rearPreferenceBonus : rules.rearPreferencePenalty;
    }
  }

  return score;
}

export function generateChoreography({ duration, estimatedBpm = null, beatTimes, difficulty = 'easy' }) {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new RangeError('duration must be a positive finite number of seconds.');
  }
  const rules = DIFFICULTY_RULES[difficulty];
  if (!rules) throw new RangeError(`Unknown difficulty: ${difficulty}`);

  const normalized = normalizeBeats(beatTimes, duration);
  const bpm = Number.isFinite(estimatedBpm) && estimatedBpm > 0 ? estimatedBpm : null;
  const beatInterval = inferBeatInterval(normalized.beats, bpm);
  const generationSeed = hashString(`${difficulty}:${duration}:${bpm ?? ''}:${normalized.beats.map((beat) => beat.timestamp).join(',')}`);
  const minimumStepGapSeconds = Math.max(
    rules.minimumStepGapSeconds,
    beatInterval * rules.minimumBeatIntervalFraction,
  );
  const warnings = [];
  if (normalized.invalidCount) warnings.push(`${normalized.invalidCount} invalid beat timestamp${normalized.invalidCount === 1 ? ' was' : 's were'} ignored.`);
  if (normalized.duplicateCount) warnings.push(`${normalized.duplicateCount} duplicate beat timestamp${normalized.duplicateCount === 1 ? ' was' : 's were'} ignored.`);
  if (!normalized.beats.length) warnings.push('No valid detected beats are available to turn into movements.');

  const steps = [];
  for (const beat of normalized.beats) {
    if (shouldLeaveBeatEmpty(beat.beatIndex, rules)) continue;

    const candidates = eligibleZones({ beat, steps, rules, minimumStepGapSeconds });
    if (!candidates.length) continue;
    const rankedCandidates = candidates
      .map((zone) => ({ zone, score: scoreZone(zone, { steps, rules }) }))
      .sort((a, b) => a.score - b.score);
    const bestScore = rankedCandidates[0].score;
    const variedCandidates = rankedCandidates.filter(({ score }) => score <= bestScore + rules.selectionVarietyWindow);
    const choiceSeed = hashString(`${generationSeed}:${beat.beatIndex}:${beat.timestamp}`);
    const zone = variedCandidates[choiceSeed % variedCandidates.length].zone;
    steps.push({
      id: `step-${String(beat.beatIndex + 1).padStart(4, '0')}`,
      timestamp: beat.timestamp,
      targetZone: zone.id,
      beatIndex: beat.beatIndex,
      difficulty,
    });
  }

  return createBeatmap({
    duration,
    estimatedBpm: bpm,
    difficulty,
    beatCount: normalized.beats.length,
    steps,
    warnings,
  });
}

export function getMovementConstraints(difficulty, estimatedBpm = null) {
  const rules = DIFFICULTY_RULES[difficulty];
  if (!rules) throw new RangeError(`Unknown difficulty: ${difficulty}`);
  const beatInterval = Number.isFinite(estimatedBpm) && estimatedBpm > 0 ? 60 / estimatedBpm : 0;
  return {
    minimumStepGapSeconds: Math.max(rules.minimumStepGapSeconds, beatInterval * rules.minimumBeatIntervalFraction),
    minimumSameFootDepthSwitchSeconds: rules.minimumSameFootDepthSwitchSeconds,
  };
}
