import type { Answer, Operation, Session } from '../../types/math.types';
import { describeItem, skillsOfCalculation } from '../learning/classify';
import { byItem, bySkill, measure, median, type Mastery } from '../learning/mastery';
import { FACT_TARGET_MS, MAX_TABLE, skill, skillsOf, type Skill } from '../learning/skills';

/** Figures of one session for one operation, a point of the trend charts. */
export interface TrendPoint {
  finishedAt: string;
  answered: number;
  accuracy: number;
  medianMs: number;
}

/** Mastery of one skill, a row of the mastery table. */
export interface SkillRow {
  skill: Skill;
  mastery: Mastery;
  medianThinkMs: number | null;
}

/** One cell of the facts grid. */
export interface FactCell {
  row: number;
  column: number;
  mastery: Mastery | null;
}

/** Count of answers in a time range. */
export interface TimeBucket {
  label: string;
  correct: number;
  wrong: number;
}

/** A fact or category that keeps failing or dragging. */
export interface WeakItem {
  label: string;
  attempts: number;
  errors: number;
  medianMs: number | null;
}

/** Everything the statistics tab shows for one operation. */
export interface OperationStats {
  answered: number;
  accuracy: number | null;
  medianAnswerMs: number | null;
  medianThinkMs: number | null;
  medianReviewMs: number | null;
  hesitationRate: number | null;
  /** Accuracy of the last seven days minus that of the seven days before, or null without both. */
  accuracyDelta: number | null;
  trend: TrendPoint[];
  skills: SkillRow[];
  grid: FactCell[] | null;
  buckets: TimeBucket[];
  weakest: WeakItem[];
}

/** Sessions shown on the trend charts. */
export const TREND_SESSIONS = 15;

/** Upper bounds of the answer time ranges, in seconds. */
export const BUCKET_LIMITS = [2, 3, 5, 10, 20, 40];

const DAY_MS = 86_400_000;

const accuracyOf = (answers: readonly Answer[]) =>
  answers.length === 0 ? null : answers.filter((answer) => answer.correct).length / answers.length;

const defined = (values: (number | undefined)[]) => values.filter((value): value is number => value !== undefined);

const answerTimes = (answers: readonly Answer[]) => answers.filter((answer) => !answer.skipped).map((answer) => answer.durationMs);

function trendOf(operation: Operation, sessions: readonly Session[]): TrendPoint[] {
  return [...sessions]
    .sort((left, right) => left.finishedAt.localeCompare(right.finishedAt))
    .map((session) => ({ session, answers: session.answers.filter((answer) => answer.operation === operation) }))
    .filter(({ answers }) => answers.length > 0)
    .slice(-TREND_SESSIONS)
    .map(({ session, answers }) => ({
      finishedAt: session.finishedAt,
      answered: answers.length,
      accuracy: accuracyOf(answers)!,
      medianMs: median(answerTimes(answers)) ?? 0,
    }));
}

function bucketsOf(answers: readonly Answer[]): TimeBucket[] {
  const labels = [...BUCKET_LIMITS.map((limit, index) => `${index === 0 ? 0 : BUCKET_LIMITS[index - 1]}–${limit} s`), `+${BUCKET_LIMITS.at(-1)} s`];
  const buckets = labels.map((label) => ({ label, correct: 0, wrong: 0 }));
  for (const answer of answers.filter((timed) => !timed.skipped)) {
    const index = BUCKET_LIMITS.findIndex((limit) => answer.durationMs < limit * 1000);
    const bucket = buckets[index === -1 ? buckets.length - 1 : index]!;
    if (answer.correct)
      bucket.correct++;
    else
      bucket.wrong++;
  }
  return buckets;
}

function gridOf(operation: Operation, answers: readonly Answer[]): FactCell[] | null {
  if (operation !== 'mul' && operation !== 'div')
    return null;
  const items = byItem(answers.map((answer) => ({ answer })));
  const cells: FactCell[] = [];
  for (let row = 1; row <= MAX_TABLE; row++)
    for (let column = 1; column <= MAX_TABLE; column++) {
      const item = operation === 'mul'
        ? `mul:${Math.min(row, column)}x${Math.max(row, column)}`
        : `div:${row * column}/${row}`;
      const group = items.get(item)?.map((entry) => entry.answer) ?? [];
      cells.push({ row, column, mastery: group.length === 0 ? null : measure(group, FACT_TARGET_MS) });
    }
  return cells;
}

function weakestOf(answers: readonly Answer[]): WeakItem[] {
  return [...byItem(answers.map((answer) => ({ answer })))]
    .map(([item, entries]) => {
      const group = entries.map((entry) => entry.answer);
      return {
        label: describeItem(item, (id) => skill(id).label),
        attempts: group.length,
        errors: group.filter((answer) => !answer.correct).length,
        medianMs: median(answerTimes(group)),
        score: measure(group, skill(skillsOfCalculation(group[0]!)[0]!).targetMs).score,
      };
    })
    .filter((item) => item.attempts >= 2 && item.score < 0.75)
    .sort((left, right) => left.score - right.score)
    .slice(0, 8)
    .map(({ score: _score, ...item }) => item);
}

/**
 * Computes the statistics of one operation for one child.
 * @param operation The operation.
 * @param sessions Sessions of the child.
 * @param now The reference date.
 * @returns Key figures, trends, mastery by skill, facts grid, time ranges and weakest items.
 */
export function operationStats(operation: Operation, sessions: readonly Session[], now: Date): OperationStats {
  const dated = sessions.flatMap((session) =>
    session.answers
      .filter((answer) => answer.operation === operation)
      .map((answer) => ({ answer, at: new Date(session.finishedAt).getTime() })),
  );
  const answers = dated.sort((left, right) => left.at - right.at).map((entry) => entry.answer);
  const lastWeek = accuracyOf(dated.filter((entry) => entry.at >= now.getTime() - 7 * DAY_MS).map((entry) => entry.answer));
  const weekBefore = accuracyOf(
    dated.filter((entry) => entry.at < now.getTime() - 7 * DAY_MS && entry.at >= now.getTime() - 14 * DAY_MS).map((entry) => entry.answer),
  );
  const groups = bySkill(answers);
  const erasures = defined(answers.map((answer) => answer.erasures));

  return {
    answered: answers.length,
    accuracy: accuracyOf(answers),
    medianAnswerMs: median(answerTimes(answers)),
    medianThinkMs: median(defined(answers.map((answer) => answer.thinkMs))),
    medianReviewMs: median(defined(answers.map((answer) => answer.reviewMs))),
    hesitationRate: erasures.length === 0 ? null : erasures.filter((count) => count > 0).length / erasures.length,
    accuracyDelta: lastWeek === null || weekBefore === null ? null : lastWeek - weekBefore,
    trend: trendOf(operation, sessions),
    skills: skillsOf(operation).map((candidate) => {
      const group = groups.get(candidate.id) ?? [];
      return {
        skill: candidate,
        mastery: measure(group, candidate.targetMs),
        medianThinkMs: median(defined(group.map((answer) => answer.thinkMs))),
      };
    }),
    grid: gridOf(operation, answers),
    buckets: bucketsOf(answers),
    weakest: weakestOf(answers),
  };
}
