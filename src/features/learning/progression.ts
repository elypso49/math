import {
  MAX_LEVEL,
  MIN_LEVEL,
  OPERATIONS,
  type Answer,
  type Level,
  type LevelChange,
  type Levels,
  type Operation,
  type Session,
} from '../../types/math.types';
import { skillsOfCalculation } from './classify';
import { measure, median, skillMastery, timeline } from './mastery';
import { frontierSkills, unlockedSkills } from './skills';

/** Answers each new skill of a level needs before the level may rise. */
export const PROMOTE_ATTEMPTS = 8;

/** Score each new skill of a level needs to open the next one. */
export const PROMOTE_SCORE = 0.8;

/** Score the easier skills must keep for the level to rise. */
export const KEEP_SCORE = 0.7;

/** Answers on the new skills of a level before it may drop. */
export const DEMOTE_ATTEMPTS = 6;

/** Accuracy on the new skills under which the level drops. */
export const DEMOTE_ACCURACY = 0.6;

/** Median answer time, in multiples of the target, over which the level drops. */
export const DEMOTE_SLOWNESS = 2.5;

const lastChangeAt = (sessions: readonly Session[], operation: Operation) =>
  Math.max(
    0,
    ...sessions
      .filter(
        (session) =>
          session.changes.some((change) => change.operation === operation) ||
          (session.kind === 'evaluation' && session.answers.some((answer) => answer.operation === operation)),
      )
      .map((session) => new Date(session.finishedAt).getTime()),
  );

function judge(operation: Operation, level: Level, answers: readonly Answer[]): LevelChange['reason'] | null {
  const frontier = frontierSkills(operation, level);
  const ids = new Set(frontier.map((candidate) => candidate.id));
  const onFrontier = answers.filter((answer) => skillsOfCalculation(answer).some((id) => ids.has(id)));
  const mastery = skillMastery(answers.filter((answer) => answer.reason !== 'retry'));

  if (level > MIN_LEVEL && onFrontier.length >= DEMOTE_ATTEMPTS) {
    const targetMs = Math.max(...frontier.map((candidate) => candidate.targetMs));
    if (measure(onFrontier, targetMs).accuracy < DEMOTE_ACCURACY)
      return 'struggling';
    const slowness = median(onFrontier.map((answer) => answer.durationMs / targetMs));
    if (slowness !== null && slowness > DEMOTE_SLOWNESS)
      return 'slow';
  }

  const frontierReady = frontier.every((candidate) => {
    const result = mastery.get(candidate.id);
    return result && result.attempts >= PROMOTE_ATTEMPTS && result.score >= PROMOTE_SCORE;
  });
  const basicsKept = unlockedSkills(operation, level)
    .filter((candidate) => candidate.level < level)
    .every((candidate) => {
      const result = mastery.get(candidate.id);
      return !result || result.attempts < 3 || result.score >= KEEP_SCORE;
    });
  return level < MAX_LEVEL && frontierReady && basicsKept ? 'mastered' : null;
}

/**
 * Moves each operation up or down one level after a training. The level rises
 * once every skill it introduced is mastered (eight answers, second chances left
 * out, score of 0.8) while the easier ones hold; it drops when its new skills
 * stay under 60 % right or take over two and a half times their target time.
 * Only answers given since the last change of that operation, or the last
 * evaluation that placed it, count, so a level is judged on its own merits.
 * @param levels Levels before the series.
 * @param sessions Earlier sessions of the child, the new one excluded.
 * @param answers Answers of the series just finished.
 * @returns The new levels and the changes applied.
 */
export function adaptLevels(
  levels: Levels,
  sessions: readonly Session[],
  answers: readonly Answer[],
): { levels: Levels; changes: LevelChange[] } {
  const history = timeline(sessions);
  const next = { ...levels };
  const changes: LevelChange[] = [];

  for (const operation of OPERATIONS) {
    const since = lastChangeAt(sessions, operation);
    const relevant = [...history.filter((entry) => entry.at > since).map((entry) => entry.answer), ...answers].filter(
      (answer) => answer.operation === operation,
    );
    const reason = judge(operation, levels[operation], relevant);
    if (!reason)
      continue;
    const to = (levels[operation] + (reason === 'mastered' ? 1 : -1)) as Level;
    next[operation] = to;
    changes.push({ operation, from: levels[operation], to, reason });
  }

  return { levels: next, changes };
}
