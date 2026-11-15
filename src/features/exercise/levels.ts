import { MAX_LEVEL, MIN_LEVEL, type Answer, type Level, type Levels, type Operation, type Session } from '../../types/math.types';
import { skillsOfCalculation } from '../learning/classify';
import { skill } from '../learning/skills';

/** Share of right answers at a level for the evaluation to grant it. */
export const EVALUATION_PASS = 2 / 3;

/** Answer time, in multiples of the skill's target, past which a right answer does not count. */
export const EVALUATION_SLOWNESS = 3;

const counts = (answer: Answer) =>
  answer.correct && answer.durationMs <= EVALUATION_SLOWNESS * skill(skillsOfCalculation(answer)[0]!).targetMs;

const accuracy = (answers: readonly Answer[]) =>
  answers.length === 0 ? 0 : answers.filter(counts).length / answers.length;

/**
 * Estimates the level of each operation from an evaluation: the child climbs
 * level by level as long as two thirds of the questions of that level are right,
 * a right answer taking over three times its target time counting as missed.
 * An operation left out of the evaluation keeps its level.
 * @param answers The evaluation answers.
 * @param previous Levels before the evaluation.
 * @returns The estimated levels.
 */
export function estimateLevels(answers: readonly Answer[], previous: Levels): Levels {
  const estimate = (operation: Operation): Level => {
    if (!answers.some((answer) => answer.operation === operation))
      return previous[operation];
    let reached: Level = MIN_LEVEL;
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      const asked = answers.filter((answer) => answer.operation === operation && answer.level === level);
      if (asked.length === 0)
        continue;
      if (accuracy(asked) < EVALUATION_PASS)
        break;
      reached = level as Level;
    }
    return reached;
  };

  return { add: estimate('add'), sub: estimate('sub'), mul: estimate('mul'), div: estimate('div') };
}

/**
 * Applies the current evaluation rule again to the latest evaluation of each
 * operation that no training has moved since, so that a level granted by an
 * earlier, more lenient rule comes back to what that evaluation shows. A level
 * is only ever lowered; running it again changes nothing.
 * @param levels Current levels of the child.
 * @param sessions Sessions of the child, in any order.
 * @returns The recalibrated levels.
 */
export function recalibrateLevels(levels: Levels, sessions: readonly Session[]): Levels {
  const ordered = [...sessions].sort((left, right) => left.finishedAt.localeCompare(right.finishedAt));
  const recalibrate = (operation: Operation): Level => {
    const evaluation = ordered
      .filter((session) => session.kind === 'evaluation' && session.answers.some((answer) => answer.operation === operation))
      .at(-1);
    if (!evaluation)
      return levels[operation];
    const movedSince = ordered.some(
      (session) => session.finishedAt > evaluation.finishedAt && session.changes.some((change) => change.operation === operation),
    );
    return movedSince ? levels[operation] : (Math.min(levels[operation], estimateLevels(evaluation.answers, levels)[operation]) as Level);
  };

  return { add: recalibrate('add'), sub: recalibrate('sub'), mul: recalibrate('mul'), div: recalibrate('div') };
}

/**
 * Flattens the training answers of a child, oldest first.
 * @param sessions Sessions of the child, in any order.
 * @returns Every training answer in chronological order.
 */
export const trainingHistory = (sessions: readonly Session[]): Answer[] =>
  [...sessions]
    .filter((session) => session.kind === 'training')
    .sort((left, right) => left.finishedAt.localeCompare(right.finishedAt))
    .flatMap((session) => session.answers);
