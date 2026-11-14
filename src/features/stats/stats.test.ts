import { describe, expect, it } from 'vitest';
import type { Session } from '../../types/math.types';
import { formatDuration, insights, startOfWeek, weekSummary } from './stats';

const session = (finishedAt: string, correct: boolean[], kind: Session['kind'] = 'training'): Session => ({
  id: finishedAt,
  childId: 'child',
  kind,
  startedAt: finishedAt,
  finishedAt,
  durationMs: 60_000,
  changes: [],
  answers: correct.map((right) => ({
    operation: 'add',
    level: 1,
    left: 1,
    right: 1,
    expected: 2,
    given: right ? 2 : 0,
    correct: right,
    durationMs: 6_000,
  })),
});

describe('startOfWeek', () => {
  it('goes back to Monday', () => {
    expect(startOfWeek(new Date(2026, 10, 15)).getDate()).toBe(9);
    expect(startOfWeek(new Date(2026, 10, 9)).getDate()).toBe(9);
  });
});

describe('weekSummary', () => {
  it('counts the trainings of the week, per day', () => {
    const now = new Date(2026, 10, 14, 12);
    const sessions = [
      session(new Date(2026, 10, 10, 9).toISOString(), [true, true, false, true]),
      session(new Date(2026, 10, 10, 18).toISOString(), [true]),
      session(new Date(2026, 10, 12, 9).toISOString(), [false], 'evaluation'),
      session(new Date(2026, 10, 2, 9).toISOString(), [true]),
    ];
    const summary = weekSummary(sessions, now);
    expect(summary.trainings).toBe(2);
    expect(summary.perDay).toEqual([0, 2, 0, 0, 0, 0, 0]);
    expect(summary.successRate).toBeCloseTo(4 / 6);
  });

  it('has no success rate without answers', () => {
    expect(weekSummary([], new Date()).successRate).toBeNull();
  });
});

describe('insights', () => {
  it('explains the latest level change of each operation', () => {
    const now = new Date(2026, 10, 14);
    const older = { ...session(new Date(2026, 10, 10).toISOString(), []), changes: [{ operation: 'div' as const, from: 2 as const, to: 3 as const, reason: 'mastered' as const }] };
    const newer = { ...session(new Date(2026, 10, 13).toISOString(), []), changes: [{ operation: 'div' as const, from: 3 as const, to: 2 as const, reason: 'slow' as const }] };
    expect(insights([older, newer], now)).toEqual([
      {
        message: 'Les divisions restent trop lentes, plus de trois fois le temps visé : la difficulté a été réduite d’un cran pour les prochains entraînements.',
        progress: false,
      },
    ]);
  });
});

describe('formatDuration', () => {
  it('reads minutes and seconds', () => {
    expect(formatDuration(252_000)).toBe('4 min 12 s');
    expect(formatDuration(38_000)).toBe('38 s');
    expect(formatDuration(2_640)).toBe('2,6 s');
    expect(formatDuration(3_000)).toBe('3 s');
  });
});
