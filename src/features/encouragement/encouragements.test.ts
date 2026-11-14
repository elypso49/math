import { describe, expect, it } from 'vitest';
import type { Answer, Session } from '../../types/math.types';
import { collectedBadges, earnedFor } from './encouragements';

let counter = 0;

const training = (correct: number, durationMs: number, finishedAt = '2026-11-12T10:00:00.000Z', length = 10): Session => ({
  id: `s${counter++}`,
  childId: 'child',
  kind: 'training',
  startedAt: finishedAt,
  finishedAt,
  durationMs,
  changes: [],
  answers: Array.from({ length }, (_, index): Answer => ({
    operation: 'add',
    level: 1,
    left: 1,
    right: 1,
    expected: 2,
    given: index < correct ? 2 : 0,
    correct: index < correct,
    durationMs: durationMs / length,
  })),
});

describe('earnedFor', () => {
  it('celebrates the very first series', () => {
    expect(earnedFor(training(5, 300_000), [])).toContain('premiere-serie');
  });

  it('puts a perfect and quick series first', () => {
    const earned = earnedFor(training(10, 120_000), [training(7, 200_000, '2026-11-01T10:00:00.000Z')]);
    expect(earned.slice(0, 3)).toEqual(['serie-parfaite', 'nouveau-record', 'eclair']);
  });

  it('spots an average time going down over three series', () => {
    const previous = [training(7, 400_000, '2026-11-01T10:00:00.000Z'), training(7, 300_000, '2026-11-02T10:00:00.000Z')];
    const earned = earnedFor(training(7, 250_000, '2026-11-03T10:00:00.000Z'), previous);
    expect(earned).toContain('tu-t-ameliores');
    expect(earned).not.toContain('serie-en-feu');
  });

  it('counts three series on the same day', () => {
    const previous = [training(6, 300_000, '2026-11-12T09:00:00.000Z'), training(6, 300_000, '2026-11-12T09:10:00.000Z')];
    expect(earnedFor(training(6, 300_000, '2026-11-12T09:20:00.000Z'), previous)).toContain('serie-en-feu');
  });

  it('praises perseverance and always ends with a message', () => {
    const earned = earnedFor(training(4, 300_000), [training(8, 200_000, '2026-11-01T10:00:00.000Z')]);
    expect(earned).toContain('pas-lache');
    expect(earned.at(-1)).toBe('presque');
  });
});

describe('earnedFor on a longer series', () => {
  it('judges a twenty-question series by its share of right answers and its time per question', () => {
    const earned = earnedFor(training(20, 300_000, '2026-11-12T10:00:00.000Z', 20), [training(9, 200_000, '2026-11-01T10:00:00.000Z')]);
    expect(earned).toEqual(expect.arrayContaining(['serie-parfaite', 'nouveau-record', 'eclair', 'objectif-atteint']));
  });

  it('does not reach the target with fifteen right answers out of twenty', () => {
    expect(earnedFor(training(15, 300_000, '2026-11-12T10:00:00.000Z', 20), [])).not.toContain('objectif-atteint');
  });
});

describe('collectedBadges', () => {
  it('keeps badges only, never plain messages', () => {
    const badges = collectedBadges([training(10, 100_000)]);
    expect(badges.has('serie-parfaite')).toBe(true);
    expect(badges.has('continue')).toBe(false);
  });
});
