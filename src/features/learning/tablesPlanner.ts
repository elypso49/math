import { createTableFact, type Question, type QuestionReason } from '../exercise/questions';
import type { Random } from '../exercise/random';
import { skillMastery, type TimedAnswer } from './mastery';
import { itemStates, type ItemState } from './schedule';

/** Tables asked by the table review, from 1 to this one. */
export const REVIEW_MAX_TABLE = 10;

/** Weight of a table whose every fact is known and quick. */
export const MASTERED_TABLE_WEIGHT = 0.15;

/** Weight of a table that is never answered right. */
export const STRUGGLING_TABLE_WEIGHT = 2;

/** Answers on a table before its mastery is trusted. */
export const TRUSTED_ATTEMPTS = 4;

const TABLES = Array.from({ length: REVIEW_MAX_TABLE }, (_, index) => index + 1);

const factItem = (table: number, multiplier: number) => `mul:${Math.min(table, multiplier)}x${Math.max(table, multiplier)}`;

/**
 * Weighs each table from its mastery over every evaluation and series: a mastered
 * table comes back rarely, a difficult one often, an unknown one at an average pace.
 * @param history Every answer of the child, oldest first.
 * @returns The weight of each table from 1 to 10.
 */
export function tableWeights(history: readonly TimedAnswer[]): Map<number, number> {
  const mastery = skillMastery(history.map((entry) => entry.answer));
  return new Map(
    TABLES.map((table) => {
      const measured = mastery.get(`mul:t${table}`);
      const trusted = measured && measured.attempts >= TRUSTED_ATTEMPTS;
      return [table, trusted ? MASTERED_TABLE_WEIGHT + (STRUGGLING_TABLE_WEIGHT - MASTERED_TABLE_WEIGHT) * (1 - measured.score) : 1];
    }),
  );
}

const factWeight = (state: ItemState | undefined, now: number) => {
  if (!state)
    return 0.8;
  const overdue = state.dueAt <= now ? 1.5 : 1;
  return (1.1 - state.mastery.score) * (1 + state.recentErrors) * overdue;
};

const reasonOf = (state: ItemState | undefined, now: number): QuestionReason => {
  if (!state)
    return 'new';
  if (state.recentErrors > 0 || state.box === 1)
    return 'weak';
  return state.dueAt <= now ? 'due' : 'practice';
};

function weightedPick<T>(items: readonly T[], weight: (item: T) => number, random: Random): T {
  const weights = items.map(weight);
  let threshold = random() * weights.reduce((total, value) => total + value, 0);
  for (let index = 0; index < items.length; index++) {
    threshold -= weights[index]!;
    if (threshold <= 0)
      return items[index]!;
  }
  return items.at(-1)!;
}

/**
 * Builds a review of the multiplication tables from 1 to 10. Each question first
 * draws a table, weighted by its mastery, never the same table twice in a row,
 * then a multiplier of that table, favouring the facts recently missed, due for
 * review or slow; a fact is asked once per series.
 * @param history Every answer of the child, oldest first.
 * @param random Source of randomness.
 * @param now The current time.
 * @param length Number of questions.
 * @returns The questions, the table on the left.
 */
export function planTables(history: readonly TimedAnswer[], random: Random, now: number, length: number): Question[] {
  const weights = tableWeights(history);
  const states = itemStates(history);
  const asked = new Set<string>();
  const questions: Question[] = [];
  let previous: number | null = null;

  while (questions.length < length) {
    const open = TABLES.filter((table) => table !== previous && TABLES.some((multiplier) => !asked.has(factItem(table, multiplier))));
    if (open.length === 0)
      break;
    const table = weightedPick(open, (candidate) => weights.get(candidate)!, random);
    const multipliers = TABLES.filter((multiplier) => !asked.has(factItem(table, multiplier)));
    const multiplier = weightedPick(multipliers, (candidate) => factWeight(states.get(factItem(table, candidate)), now), random);
    const item = factItem(table, multiplier);
    asked.add(item);
    questions.push({ ...createTableFact(table, multiplier), reason: reasonOf(states.get(item), now) });
    previous = table;
  }
  return questions;
}
