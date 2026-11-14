import { MAX_LEVEL, MIN_LEVEL, type Answer, type Level, type Levels, type Operation, type Session } from '../../types/math.types';
import { activeOperations } from './series';

/** Share of right answers at a level for the evaluation to grant it. */
export const EVALUATION_PASS = 0.5;

const clamp = (value: number): Level => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, value)) as Level;

const accuracy = (answers: readonly Answer[]) =>
  answers.length === 0 ? 0 : answers.filter((answer) => answer.correct).length / answers.length;

/**
 * Estimates the level of each operation from an evaluation: the child climbs
 * level by level as long as at least half of the questions of that level are right.
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
 * Flattens the training answers of a child, oldest first.
 * @param sessions Sessions of the child, in any order.
 * @returns Every training answer in chronological order.
 */
export const trainingHistory = (sessions: readonly Session[]): Answer[] =>
  [...sessions]
    .filter((session) => session.kind === 'training')
    .sort((left, right) => left.finishedAt.localeCompare(right.finishedAt))
    .flatMap((session) => session.answers);

/**
 * Rounds the mean level of the operations the child practises.
 * @param levels Levels of a child.
 * @param operations Operations chosen by the parent.
 * @returns The overall level, from 1 to 5.
 */
export function overallLevel(levels: Levels, operations: readonly Operation[]): Level {
  const practised = activeOperations(operations);
  return clamp(Math.round(practised.reduce((total, operation) => total + levels[operation], 0) / practised.length));
}
