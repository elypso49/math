import { describe, expect, it } from 'vitest';
import type { Answer, Level, LevelChange, Operation, Session } from '../../types/math.types';
import { estimateLevels, recalibrateLevels } from './levels';

const answer = (operation: Operation, level: Level, correct: boolean, durationMs = 5_000): Answer => ({
  operation,
  level,
  left: 1,
  right: 1,
  expected: 2,
  given: correct ? 2 : 3,
  correct,
  durationMs,
});

describe('estimateLevels', () => {
  it('climbs while two thirds of each level are right', () => {
    const answers = [
      answer('add', 1, true),
      answer('add', 2, true),
      answer('add', 2, true),
      answer('add', 2, false),
      answer('add', 3, true),
      answer('add', 3, false),
      answer('add', 4, true),
      answer('add', 5, true),
      answer('mul', 1, false),
    ];
    const levels = estimateLevels(answers, { add: 1, sub: 1, mul: 1, div: 1 });
    expect(levels.add).toBe(2);
    expect(levels.mul).toBe(1);
    expect(levels.sub).toBe(1);
  });

  it('counts a right answer as missed when it takes over three times its target', () => {
    const answers = [answer('add', 1, true), answer('add', 2, true, 10_000)];
    expect(estimateLevels(answers, { add: 1, sub: 1, mul: 1, div: 1 }).add).toBe(1);
  });

  it('keeps the level of an operation left out of the evaluation', () => {
    const levels = estimateLevels([answer('add', 1, false)], { add: 3, sub: 2, mul: 4, div: 5 });
    expect(levels).toEqual({ add: 1, sub: 2, mul: 4, div: 5 });
  });
});

const session = (finishedAt: string, kind: Session['kind'], answers: Answer[], changes: LevelChange[] = []): Session => ({
  id: finishedAt,
  childId: 'child',
  kind,
  startedAt: finishedAt,
  finishedAt,
  durationMs: 0,
  answers,
  changes,
});

const lenientEvaluation = session('2026-11-10T10:00:00Z', 'evaluation', [
  answer('add', 1, true),
  answer('add', 2, true),
  answer('add', 2, false),
  answer('add', 3, true),
  answer('add', 4, true),
  answer('add', 5, true),
]);

describe('recalibrateLevels', () => {
  const placed = { add: 5 as Level, sub: 2 as Level, mul: 1 as Level, div: 1 as Level };

  it('brings a level granted by the former rule back to the latest evaluation', () => {
    expect(recalibrateLevels(placed, [lenientEvaluation])).toEqual({ ...placed, add: 1 });
  });

  it('keeps a level a training moved after the evaluation', () => {
    const promoted = session('2026-11-11T10:00:00Z', 'training', [], [{ operation: 'add', from: 4, to: 5, reason: 'mastered' }]);
    expect(recalibrateLevels(placed, [promoted, lenientEvaluation])).toEqual(placed);
  });

  it('never raises a level and changes nothing a second time', () => {
    const once = recalibrateLevels(placed, [lenientEvaluation]);
    expect(recalibrateLevels(once, [lenientEvaluation])).toEqual(once);
    expect(recalibrateLevels({ ...placed, add: 1 }, [session('2026-11-12T10:00:00Z', 'evaluation', [answer('add', 1, true), answer('add', 2, true)])]).add).toBe(1);
  });
});
