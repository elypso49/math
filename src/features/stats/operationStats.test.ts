import { describe, expect, it } from 'vitest';
import type { Answer, Session } from '../../types/math.types';
import { operationStats } from './operationStats';

const product = (left: number, right: number, correct: boolean, durationMs: number, thinkMs: number): Answer => ({
  operation: 'mul',
  level: 3,
  left,
  right,
  expected: left * right,
  given: correct ? left * right : 0,
  correct,
  durationMs,
  thinkMs,
  erasures: correct ? 0 : 1,
});

const session = (finishedAt: string, answers: Answer[]): Session => ({
  id: finishedAt,
  childId: 'child',
  kind: 'training',
  startedAt: finishedAt,
  finishedAt,
  durationMs: 0,
  answers,
  changes: [],
});

const sessions = [
  session('2026-11-12T10:00:00Z', [product(7, 8, false, 9_000, 4_000), product(2, 3, true, 1_500, 600), product(7, 6, false, 8_000, 3_000)]),
  session('2026-11-13T10:00:00Z', [product(8, 7, true, 6_000, 2_500), product(7, 9, false, 7_000, 3_500), product(2, 4, true, 1_800, 700)]),
];

describe('operationStats', () => {
  const stats = operationStats('mul', sessions, new Date('2026-11-14T12:00:00Z'));

  it('sums up the timings of each question', () => {
    expect(stats.answered).toBe(6);
    expect(stats.accuracy).toBeCloseTo(3 / 6);
    expect(stats.medianThinkMs).toBe(2_750);
    expect(stats.hesitationRate).toBeCloseTo(3 / 6);
  });

  it('rates every table from 1 to 12', () => {
    const tables = stats.skills.filter((row) => row.skill.table);
    expect(tables).toHaveLength(12);
    expect(tables.find((row) => row.skill.table === 7)!.mastery.score).toBeLessThan(tables.find((row) => row.skill.table === 2)!.mastery.score);
    expect(tables.find((row) => row.skill.table === 11)!.mastery.band).toBe('unseen');
  });

  it('fills the facts grid symmetrically', () => {
    const cell = (row: number, column: number) => stats.grid!.find((candidate) => candidate.row === row && candidate.column === column)!;
    expect(cell(7, 8).mastery?.attempts).toBe(2);
    expect(cell(8, 7).mastery?.attempts).toBe(2);
    expect(cell(12, 12).mastery).toBeNull();
  });

  it('lists the table of 7 among the items to work on', () => {
    expect(stats.weakest.map((item) => item.label)).toContain('7 × 8');
  });

  it('draws one trend point per session', () => {
    expect(stats.trend.map((point) => point.answered)).toEqual([3, 3]);
  });

  it('leaves the questions given up out of the answer times', () => {
    const skipped: Answer = { ...product(9, 12, false, 60_000, 60_000), thinkMs: undefined, skipped: true };
    const withSkip = operationStats('mul', [...sessions, session('2026-11-14T10:00:00Z', [skipped])], new Date('2026-11-14T12:00:00Z'));
    expect(withSkip.answered).toBe(7);
    expect(withSkip.medianAnswerMs).toBe(stats.medianAnswerMs);
    expect(withSkip.buckets.reduce((total, bucket) => total + bucket.correct + bucket.wrong, 0)).toBe(6);
  });
});
