import { MIN_LEVEL, OPERATIONS, type Level, type Levels, type Operation, type SessionKind } from '../../types/math.types';
import type { TimedAnswer } from '../learning/mastery';
import { planTraining, type Learner } from '../learning/planner';
import { planTables } from '../learning/tablesPlanner';
import { createQuestion, withBlank, type Question } from './questions';
import { shuffle, type Random } from './random';

/** Usual number of questions in a training series. */
export const TRAINING_LENGTH = 10;

/** Lengths a child may pick for a training series. */
export const TRAINING_LENGTHS = [10, 15, 20, 25] as const;

/**
 * Reads a training length, falling back to the usual one when it is not offered.
 * @param value Raw value, for example from the address.
 * @returns One of the offered lengths.
 */
export const trainingLength = (value: string | null): number =>
  TRAINING_LENGTHS.find((length) => String(length) === value) ?? TRAINING_LENGTH;

/** Number of questions in an evaluation. */
export const EVALUATION_LENGTH = 25;

/** Questions an evaluation may add, one per question given up as too hard. */
export const MAX_EXTRA_QUESTIONS = 25;

/**
 * Tells whether a session is practice (a training, a table review or calculations
 * with a blank) rather than an evaluation.
 * @param kind Kind of session.
 * @returns True for every kind but the evaluation.
 */
export const isPractice = (kind: SessionKind) => kind !== 'evaluation';

/** Operations practised when the parent has not chosen any. */
export const DEFAULT_OPERATIONS: Operation[] = ['add', 'sub'];

/**
 * Lists the operations a child practises, in the usual order.
 * @param operations Operations chosen by the parent, possibly none.
 * @returns The chosen operations, or the default ones when none is chosen.
 */
export const activeOperations = (operations: readonly Operation[]): Operation[] =>
  OPERATIONS.filter((operation) => (operations.length > 0 ? operations : DEFAULT_OPERATIONS).includes(operation));

/**
 * Builds a training series adapted to the child, see planTraining.
 * @param learner Operations and levels of the child.
 * @param history Every answer of the child, oldest first.
 * @param random Source of randomness.
 * @param now The current time.
 * @param length Number of questions.
 * @returns The questions of the series.
 */
export const buildTraining = (learner: Learner, history: readonly TimedAnswer[], random: Random, now: number, length = TRAINING_LENGTH) =>
  planTraining(learner, history, random, now, length);

/**
 * Builds an evaluation: the operations the child practises at every level, five
 * questions per level, in a mixed order.
 * @param random Source of randomness.
 * @param operations Operations chosen by the parent.
 * @returns Twenty-five questions.
 */
export function buildEvaluation(random: Random, operations: readonly Operation[]): Question[] {
  const asked = activeOperations(operations);
  const questions = Array.from({ length: EVALUATION_LENGTH }, (_, index): Question => {
    const operation = asked[index % asked.length]!;
    const level = (Math.floor(index / 5) + 1) as Level;
    return { ...createQuestion(operation, level, random), reason: 'evaluation' };
  });
  return shuffle(random, questions);
}

/**
 * Builds the questions of a session of the given kind.
 * @param kind Training or evaluation.
 * @param learner Operations and levels of the child.
 * @param history Every answer of the child, oldest first.
 * @param random Source of randomness.
 * @param now The current time.
 * @param trainingLength Number of questions of a training or a table review.
 * @returns The questions, in the order they are asked.
 */
export const buildSeries = (
  kind: SessionKind,
  learner: Learner,
  history: readonly TimedAnswer[],
  random: Random,
  now: number,
  trainingLength = TRAINING_LENGTH,
) => {
  if (kind === 'evaluation')
    return buildEvaluation(random, learner.operations);
  if (kind === 'tables')
    return planTables(history, random, now, trainingLength);
  const questions = buildTraining(learner, history, random, now, trainingLength);
  return kind === 'blanks' ? questions.map((question) => withBlank(question, random)) : questions;
};

/** Levels of a child who has never been evaluated. */
export const initialLevels = (): Levels => ({ add: MIN_LEVEL, sub: MIN_LEVEL, mul: MIN_LEVEL, div: MIN_LEVEL });
