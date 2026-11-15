import type { Answer, Session } from '../../types/math.types';
import { itemOf, skillsOfCalculation } from './classify';
import { skill, type SkillId } from './skills';

/** An answer with the moment it was given and the kind of session it came from. */
export interface TimedAnswer {
  answer: Answer;
  at: number;
  kind: Session['kind'];
}

/** How well something is known, from never seen to automatic. */
export type MasteryBand = 'unseen' | 'fragile' | 'learning' | 'solid' | 'automatic';

/** Mastery of a skill or an item, computed from its latest answers. */
export interface Mastery {
  attempts: number;
  /** Recency-weighted share of right answers, a hesitant one counting for 0.75, from 0 to 1. */
  accuracy: number;
  /** Median answer time of the right answers, or null without any. */
  medianMs: number | null;
  /** 1 at or under the target time, 0 at three times the target. */
  speed: number;
  /** Combined score, from 0 to 1: accuracy and speed weigh half each. */
  score: number;
  band: MasteryBand;
}

/** Answers considered when measuring mastery: the latest ones only, so that progress shows. */
export const MASTERY_WINDOW = 12;

/** Weight lost by each older answer when averaging. */
export const RECENCY_DECAY = 0.85;

/** Credit of a right answer typed after erasing digits, a sign of hesitation. */
export const HESITATION_CREDIT = 0.75;

const credit = (answer: Answer) => {
  if (!answer.correct)
    return 0;
  return answer.erasures ? HESITATION_CREDIT : 1;
};

/**
 * Flattens the sessions into a chronological list of answers.
 * @param sessions Sessions of one child, in any order.
 * @returns Every answer, oldest first, stamped with its session end.
 */
export function timeline(sessions: readonly Session[]): TimedAnswer[] {
  return [...sessions]
    .sort((left, right) => left.finishedAt.localeCompare(right.finishedAt))
    .flatMap((session) => {
      const end = new Date(session.finishedAt).getTime();
      const count = session.answers.length;
      return session.answers.map((answer, index) => ({ answer, at: end - (count - 1 - index), kind: session.kind }));
    });
}

/**
 * Computes the median of a list of numbers.
 * @param values Numbers, in any order.
 * @returns The median, or null for an empty list.
 */
export function median(values: readonly number[]): number | null {
  if (values.length === 0)
    return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

const bandOf = (attempts: number, score: number, speed: number): MasteryBand => {
  if (attempts === 0)
    return 'unseen';
  if (score < 0.5)
    return 'fragile';
  if (score < 0.75)
    return 'learning';
  if (score >= 0.9 && speed >= 0.8 && attempts >= 5)
    return 'automatic';
  return 'solid';
};

/**
 * Measures mastery from answers given to the same skill or item.
 * @param answers Answers, oldest first.
 * @param targetMs Answer time under which the answer counts as automatic.
 * @returns Attempts, weighted accuracy, median time, speed, score and band.
 */
export function measure(answers: readonly Answer[], targetMs: number): Mastery {
  const recent = answers.slice(-MASTERY_WINDOW);
  if (recent.length === 0)
    return { attempts: 0, accuracy: 0, medianMs: null, speed: 0, score: 0, band: 'unseen' };

  const weights = recent.map((_, index) => RECENCY_DECAY ** (recent.length - 1 - index));
  const accuracy = recent.reduce((total, answer, index) => total + credit(answer) * weights[index]!, 0) /
    weights.reduce((total, weight) => total + weight, 0);
  const medianMs = median(recent.filter((answer) => answer.correct).map((answer) => answer.durationMs));
  const speed = medianMs === null ? 0 : Math.min(1, Math.max(0, (3 * targetMs - medianMs) / (2 * targetMs)));
  const score = accuracy * (0.5 + 0.5 * speed);

  return { attempts: answers.length, accuracy, medianMs, speed, score, band: bandOf(answers.length, score, speed) };
}

/**
 * Groups answers by the skills they train.
 * @param answers Answers, oldest first.
 * @returns For each skill, its answers in chronological order.
 */
export function bySkill(answers: readonly Answer[]): Map<SkillId, Answer[]> {
  const groups = new Map<SkillId, Answer[]>();
  for (const answer of answers)
    for (const id of skillsOfCalculation(answer))
      groups.set(id, [...(groups.get(id) ?? []), answer]);
  return groups;
}

/**
 * Measures every skill that received at least one answer.
 * @param answers Answers, oldest first.
 * @returns Mastery of each skill.
 */
export function skillMastery(answers: readonly Answer[]): Map<SkillId, Mastery> {
  return new Map([...bySkill(answers)].map(([id, group]) => [id, measure(group, skill(id).targetMs)]));
}

/**
 * Groups answers by item.
 * @param answers Answers, oldest first.
 * @returns For each item, its answers in chronological order.
 */
export function byItem<T extends { answer: Answer }>(answers: readonly T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const entry of answers) {
    const item = itemOf(entry.answer);
    groups.set(item, [...(groups.get(item) ?? []), entry]);
  }
  return groups;
}
