import type { Level, LevelChange, Operation, Session } from '../../types/math.types';
import { skillMastery, timeline } from '../learning/mastery';
import { skill } from '../learning/skills';

/** Plural name of each operation, as a heading. */
export const OPERATION_NAMES: Record<Operation, string> = {
  add: 'Additions',
  sub: 'Soustractions',
  mul: 'Multiplications',
  div: 'Divisions',
};

/** Visual tone of a level, from struggling to mastered. */
export type LevelTone = 'danger' | 'warning' | 'neutral' | 'success';

/** Label and tone shown next to a level. */
export const LEVEL_LABELS: Record<Level, { label: string; tone: LevelTone }> = {
  1: { label: 'Débutant', tone: 'danger' },
  2: { label: 'À consolider', tone: 'warning' },
  3: { label: 'En progrès', tone: 'neutral' },
  4: { label: 'Maîtrisé', tone: 'success' },
  5: { label: 'Expert', tone: 'success' },
};

/** Figures of one finished session. */
export interface SessionFigures {
  total: number;
  correct: number;
  averageMs: number;
}

/**
 * Counts the right answers and the mean time per answer of a session.
 * @param session A finished session.
 * @returns Its figures.
 */
export function figures(session: Session): SessionFigures {
  const correct = session.answers.filter((answer) => answer.correct).length;
  const averageMs = session.answers.length === 0 ? 0 : session.durationMs / session.answers.length;
  return { total: session.answers.length, correct, averageMs };
}

const latestFirst = (sessions: readonly Session[]) =>
  [...sessions].sort((left, right) => right.finishedAt.localeCompare(left.finishedAt));

/**
 * Finds the most recent evaluation.
 * @param sessions Sessions of one child.
 * @returns The latest evaluation, or null if the child never took one.
 */
export const lastEvaluation = (sessions: readonly Session[]): Session | null =>
  latestFirst(sessions).find((session) => session.kind === 'evaluation') ?? null;

/** Activity of the current week. */
export interface WeekSummary {
  trainings: number;
  /** Share of right answers this week, from 0 to 1, or null without any answer. */
  successRate: number | null;
  /** Trainings per day, Monday first. */
  perDay: number[];
}

/**
 * Returns the Monday, at midnight, of the week holding a date.
 * @param date Any date.
 * @returns Start of its week, local time.
 */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

/**
 * Summarises the trainings and answers of the week holding a date.
 * @param sessions Sessions of one child.
 * @param now The reference date.
 * @returns Number of trainings, success rate and trainings per day.
 */
export function weekSummary(sessions: readonly Session[], now: Date): WeekSummary {
  const start = startOfWeek(now).getTime();
  const end = start + 7 * 86_400_000;
  const week = sessions.filter((session) => {
    const finished = new Date(session.finishedAt).getTime();
    return finished >= start && finished < end;
  });

  const trainings = week.filter((session) => session.kind !== 'evaluation');
  const perDay = Array.from({ length: 7 }, () => 0);
  trainings.forEach((session) => perDay[(new Date(session.finishedAt).getDay() + 6) % 7]!++);

  const answers = week.flatMap((session) => session.answers);
  const successRate = answers.length === 0 ? null : answers.filter((answer) => answer.correct).length / answers.length;

  return { trainings: trainings.length, successRate, perDay };
}

const describeChange = (change: LevelChange): string => {
  const name = OPERATION_NAMES[change.operation].toLowerCase();
  switch (change.reason) {
    case 'slow':
      return `Les ${name} restent trop lentes, plus de trois fois le temps visé : la difficulté a été réduite d’un cran pour les prochains entraînements.`;
    case 'struggling':
      return `Les ${name} posent encore problème, moins d’une réponse sur deux est juste : la difficulté a été réduite d’un cran.`;
    case 'mastered':
      return `Les ${name} sont bien maîtrisées : la difficulté a été augmentée d’un cran.`;
  }
};

/** Explanation of a level change shown to the parent. */
export interface Insight {
  message: string;
  /** True when the level went up. */
  progress: boolean;
}

/**
 * Explains the level changes made by the latest trainings of the last seven days.
 * @param sessions Sessions of one child.
 * @param now The reference date.
 * @returns One explanation per operation whose level moved, the latest move only.
 */
export function insights(sessions: readonly Session[], now: Date): Insight[] {
  const since = now.getTime() - 7 * 86_400_000;
  const recent = latestFirst(sessions).filter((session) => new Date(session.finishedAt).getTime() >= since);
  const latest = new Map<Operation, LevelChange>();
  recent
    .flatMap((session) => session.changes)
    .forEach((change) => {
      if (!latest.has(change.operation))
        latest.set(change.operation, change);
    });
  return [...latest.values()].map((change) => ({ message: describeChange(change), progress: change.reason === 'mastered' }));
}

/** Answers a table needs before it can be called fragile. */
export const FRAGILE_ATTEMPTS = 4;

/**
 * Points out the multiplication and division tables the child keeps missing.
 * @param sessions Sessions of one child.
 * @returns One explanation per fragile table, weakest first.
 */
export function fragileSkills(sessions: readonly Session[]): Insight[] {
  const mastery = skillMastery(timeline(sessions).map((entry) => entry.answer));
  return [...mastery]
    .map(([id, result]) => ({ skill: skill(id), result }))
    .filter(({ skill: candidate, result }) => candidate.table && result.attempts >= FRAGILE_ATTEMPTS && result.score < 0.5)
    .sort((left, right) => left.result.score - right.result.score)
    .map(({ skill: candidate, result }) => ({
      message: candidate.operation === 'mul'
        ? `La table de ${candidate.table} reste fragile (${Math.round(result.accuracy * 100)} % de réussite récente) : elle revient plus souvent dans les séries.`
        : `Les divisions par ${candidate.table} restent fragiles (${Math.round(result.accuracy * 100)} % de réussite récente) : elles reviennent plus souvent dans les séries.`,
      progress: false,
    }));
}

/**
 * Writes a duration the way a child reads it, to the tenth of a second under ten seconds.
 * @param ms Duration in milliseconds.
 * @returns For example "2,6 s", "38 s" or "4 min 12 s".
 */
export function formatDuration(ms: number): string {
  if (ms < 10_000)
    return `${(Math.round(ms / 100) / 10).toLocaleString('fr-FR')} s`;
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes === 0 ? `${seconds} s` : `${minutes} min ${String(seconds % 60).padStart(2, '0')} s`;
}

/**
 * Writes a date as day and month.
 * @param iso ISO date.
 * @returns For example "12 novembre".
 */
export const formatDay = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
