import type { Levels, Operation } from '../../types/math.types';
import { createFromItem, type Question, type QuestionReason } from '../exercise/questions';
import { pick, shuffle, type Random } from '../exercise/random';
import { isFactItem, skillsOfItem } from './classify';
import { skillMastery, type TimedAnswer } from './mastery';
import { itemStates, type ItemState } from './schedule';
import { MAX_TABLE, skill, unlockedSkills, type Skill, type SkillId } from './skills';

/** What the planner needs to know about the child. */
export interface Learner {
  operations: readonly Operation[];
  levels: Levels;
}

interface Candidate {
  item: string;
  operation: Operation;
  level: number;
  skills: SkillId[];
}

/** Questions targeting the child's weakest items in every series. */
export const WEAK_SLOTS = 3;

/** Most items brought back by the spaced repetition schedule in one series. */
export const DUE_SLOTS = 4;

/** Training answers looked at to keep the success rate near the 80–85 % sweet spot. */
export const SUCCESS_WINDOW = 30;

/** Times a category may appear in one series; a fact appears once. */
export const CATEGORY_REPEATS = 3;

const DEFAULT_OPERATIONS: Operation[] = ['add', 'sub'];

const factItems = (unlocked: Skill): string[] =>
  Array.from({ length: MAX_TABLE }, (_, index) => index + 1).map((other) => {
    const table = unlocked.table!;
    return unlocked.operation === 'mul'
      ? `mul:${Math.min(table, other)}x${Math.max(table, other)}`
      : `div:${table * other}/${table}`;
  });

const toCandidate = (item: string, operation: Operation, level: number): Candidate => ({
  item,
  operation,
  level,
  skills: skillsOfItem(item),
});

/**
 * Lists everything a series may ask: every fact of the open tables and every
 * open complexity category, for the operations the parent chose.
 * @param learner Operations and levels of the child.
 * @returns One candidate per item.
 */
export function candidatePool(learner: Learner): Candidate[] {
  const operations = learner.operations.length > 0 ? learner.operations : DEFAULT_OPERATIONS;
  const pool = new Map<string, Candidate>();
  for (const operation of operations)
    for (const unlocked of unlockedSkills(operation, learner.levels[operation]))
      for (const item of unlocked.table ? factItems(unlocked) : [unlocked.id])
        if (!pool.has(item))
          pool.set(item, toCandidate(item, operation, unlocked.level));
  return [...pool.values()];
}

/**
 * Picks how many never-seen items a series introduces, from the recent success
 * rate: more when everything goes right, none while the child struggles.
 * @param history Every answer of the child, oldest first.
 * @returns Between 0 and 3.
 */
export function newItemSlots(history: readonly TimedAnswer[]): number {
  const recent = history.filter((entry) => entry.kind !== 'evaluation').slice(-SUCCESS_WINDOW);
  if (recent.length === 0)
    return 2;
  const rate = recent.filter((entry) => entry.answer.correct).length / recent.length;
  if (rate > 0.9)
    return 3;
  if (rate >= 0.7)
    return 2;
  return rate >= 0.55 ? 1 : 0;
}

/**
 * Builds a ten-question training series. Each series mixes, in this order of
 * priority: the weakest items (recent errors, first Leitner box), the items the
 * spacing schedule brings back today, a few never-seen items when the success
 * rate allows it, then a weighted draw where fragile tables come back more
 * often. The questions are finally interleaved so that two neighbours never
 * share the same item, and rarely the same operation.
 * @param learner Operations and levels of the child.
 * @param history Every answer of the child, oldest first.
 * @param random Source of randomness.
 * @param now The current time.
 * @param length Number of questions.
 * @returns The questions, each tagged with why it was chosen.
 */
export function planTraining(
  learner: Learner,
  history: readonly TimedAnswer[],
  random: Random,
  now: number,
  length: number,
): Question[] {
  const pool = candidatePool(learner);
  const states = itemStates(history);
  const tables = skillMastery(history.map((entry) => entry.answer));

  const boost = (candidate: Candidate) =>
    Math.max(
      ...candidate.skills.map((id) => {
        const mastery = tables.get(id);
        return mastery && mastery.attempts >= 4 ? 1 + 2 * (1 - mastery.score) : 1;
      }),
    );
  const stateOf = (candidate: Candidate): ItemState | undefined => states.get(candidate.item);
  const weakness = (state: ItemState) => state.recentErrors * 2 + (1 - state.mastery.score) + (state.box === 1 ? 1 : 0);

  const chosen: { candidate: Candidate; reason: QuestionReason }[] = [];
  const uses = (candidate: Candidate) => chosen.filter((entry) => entry.candidate.item === candidate.item).length;
  const available = (candidate: Candidate) => uses(candidate) < (isFactItem(candidate.item) ? 1 : CATEGORY_REPEATS);
  const take = (candidates: Candidate[], count: number, reason: QuestionReason) =>
    candidates
      .filter(available)
      .slice(0, Math.max(0, Math.min(count, length - chosen.length)))
      .forEach((candidate) => chosen.push({ candidate, reason }));

  const weak = pool
    .filter((candidate) => {
      const state = stateOf(candidate);
      return state && (state.recentErrors > 0 || state.box === 1);
    })
    .sort((left, right) => weakness(stateOf(right)!) * boost(right) - weakness(stateOf(left)!) * boost(left));
  take(weak, WEAK_SLOTS, 'weak');

  const due = pool
    .filter((candidate) => {
      const state = stateOf(candidate);
      return state && state.dueAt <= now;
    })
    .sort((left, right) => stateOf(left)!.dueAt - stateOf(right)!.dueAt);
  take(due, DUE_SLOTS, 'due');

  const frontier = Math.max(...pool.map((candidate) => candidate.level));
  const unseen = shuffle(random, pool.filter((candidate) => !stateOf(candidate)))
    .sort((left, right) => Number(right.level === frontier) - Number(left.level === frontier));
  take(unseen, newItemSlots(history), 'new');

  const weight = (candidate: Candidate) => {
    const state = stateOf(candidate);
    const score = state ? state.mastery.score : 0.5;
    const overdue = state && state.dueAt <= now ? 1.5 : 1;
    return (1.1 - score) * boost(candidate) * overdue;
  };
  while (chosen.length < length) {
    const open = pool.filter(available);
    if (open.length === 0)
      break;
    chosen.push({ candidate: weightedPick(open, weight, random), reason: 'practice' });
  }

  ensureCoverage(chosen, pool, random);
  return interleave(chosen, random).map(({ candidate, reason }) => ({ ...createFromItem(candidate.item, random), reason }));
}

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

function ensureCoverage(chosen: { candidate: Candidate; reason: QuestionReason }[], pool: Candidate[], random: Random) {
  const operations = [...new Set(pool.map((candidate) => candidate.operation))];
  for (const operation of operations) {
    if (chosen.some((entry) => entry.candidate.operation === operation))
      continue;
    const slot = chosen.map((entry) => entry.reason).lastIndexOf('practice');
    if (slot >= 0)
      chosen[slot] = { candidate: pick(random, pool.filter((candidate) => candidate.operation === operation)), reason: 'practice' };
  }
}

function interleave<T extends { candidate: Candidate }>(entries: T[], random: Random): T[] {
  const remaining = shuffle(random, entries);
  const ordered: T[] = [];
  while (remaining.length > 0) {
    const previous = ordered.at(-1)?.candidate;
    const differs = (entry: T, strict: boolean) =>
      !previous || (entry.candidate.item !== previous.item && (!strict || entry.candidate.operation !== previous.operation));
    const index = [remaining.findIndex((entry) => differs(entry, true)), remaining.findIndex((entry) => differs(entry, false)), 0]
      .find((candidate) => candidate >= 0)!;
    ordered.push(remaining.splice(index, 1)[0]!);
  }
  return ordered;
}

/**
 * Describes the skill an item belongs to, for the parent.
 * @param item Item name.
 * @returns The label of its first skill.
 */
export const itemSkillLabel = (item: string) => skill(skillsOfItem(item)[0]!).label;
