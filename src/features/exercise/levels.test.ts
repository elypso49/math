import { describe, expect, it } from 'vitest';
import type { Answer, Level, Operation } from '../../types/math.types';
import { estimateLevels, overallLevel } from './levels';

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
  it('climbs while at least half of each level is right', () => {
    const answers = [
      answer('add', 1, true),
      answer('add', 2, true),
      answer('add', 3, true),
      answer('add', 3, false),
      answer('add', 4, false),
      answer('add', 5, true),
      answer('mul', 1, false),
    ];
    const levels = estimateLevels(answers, { add: 1, sub: 1, mul: 1, div: 1 });
    expect(levels.add).toBe(3);
    expect(levels.mul).toBe(1);
    expect(levels.sub).toBe(1);
  });

  it('keeps the level of an operation left out of the evaluation', () => {
    const levels = estimateLevels([answer('add', 1, false)], { add: 3, sub: 2, mul: 4, div: 5 });
    expect(levels).toEqual({ add: 1, sub: 2, mul: 4, div: 5 });
  });
});

describe('overallLevel', () => {
  it('rounds the mean level', () => {
    expect(overallLevel({ add: 4, sub: 3, mul: 2, div: 1 }, ['add', 'sub', 'mul', 'div'])).toBe(3);
  });

  it('leaves out the operations the parent turned off', () => {
    expect(overallLevel({ add: 4, sub: 4, mul: 3, div: 1 }, ['add', 'sub', 'mul'])).toBe(4);
  });
});
