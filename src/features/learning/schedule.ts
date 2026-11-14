import { skillsOfCalculation } from './classify';
import { byItem, measure, type Mastery, type TimedAnswer } from './mastery';
import { skill } from './skills';

/** Leitner box of an item, from 1 (seen again every series) to 5 (seen again in three weeks). */
export type Box = 1 | 2 | 3 | 4 | 5;

/** Days before an item comes back, by box. */
export const BOX_INTERVAL_DAYS: Record<Box, number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 21 };

/** A right answer slower than this many times the target keeps the item in its box. */
export const SLOW_FACTOR = 2;

const DAY_MS = 86_400_000;

/** Spaced repetition state of one item. */
export interface ItemState {
  item: string;
  box: Box;
  lastAt: number;
  dueAt: number;
  /** Wrong answers among the five latest. */
  recentErrors: number;
  mastery: Mastery;
}

const nextBox = (box: Box, correct: boolean, fast: boolean): Box => {
  if (!correct)
    return 1;
  if (!fast)
    return box;
  return Math.min(5, box + 1) as Box;
};

/**
 * Replays every answer through the Leitner boxes: a quick right answer moves
 * the item up a box, a slow one keeps it in place, a wrong one sends it back to
 * the first box, seen again at the next series.
 * @param history Every answer of the child, oldest first.
 * @returns The state of each item ever answered.
 */
export function itemStates(history: readonly TimedAnswer[]): Map<string, ItemState> {
  const states = new Map<string, ItemState>();
  for (const [item, entries] of byItem(history)) {
    const targetMs = skill(skillsOfCalculation(entries[0]!.answer)[0]!).targetMs;
    const box = entries.reduce<Box>(
      (current, { answer }) => nextBox(current, answer.correct, answer.durationMs <= SLOW_FACTOR * targetMs),
      1,
    );
    const lastAt = entries.at(-1)!.at;
    const answers = entries.map((entry) => entry.answer);
    states.set(item, {
      item,
      box,
      lastAt,
      dueAt: lastAt + BOX_INTERVAL_DAYS[box] * DAY_MS,
      recentErrors: answers.slice(-5).filter((answer) => !answer.correct).length,
      mastery: measure(answers, targetMs),
    });
  }
  return states;
}
