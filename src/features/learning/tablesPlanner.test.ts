import { describe, expect, it } from 'vitest';
import type { Answer } from '../../types/math.types';
import { seeded } from '../exercise/random';
import type { TimedAnswer } from './mastery';
import { planTables, tableWeights } from './tablesPlanner';

const NOW = new Date('2026-11-14T12:00:00Z').getTime();

const fact = (table: number, multiplier: number, correct: boolean, index: number): TimedAnswer => {
  const answer: Answer = {
    operation: 'mul',
    level: 1,
    left: table,
    right: multiplier,
    expected: table * multiplier,
    given: correct ? table * multiplier : 0,
    correct,
    durationMs: correct ? 1_500 : 6_000,
  };
  return { answer, at: NOW - 86_400_000 + index, kind: 'training' };
};

const history = [
  ...Array.from({ length: 10 }, (_, index) => fact(7, index + 1, index % 3 === 0, index)),
  ...Array.from({ length: 10 }, (_, index) => fact(2, index + 1, true, 20 + index)),
];

describe('tableWeights', () => {
  it('weighs a difficult table well above a mastered one', () => {
    const weights = tableWeights(history);
    expect(weights.get(7)!).toBeGreaterThan(4 * weights.get(2)!);
    expect(weights.get(5)).toBe(1);
  });
});

describe('planTables', () => {
  it('asks multiplications of the tables from 1 to 10 only, each fact once', () => {
    const questions = planTables(history, seeded(3), NOW, 25);
    expect(questions).toHaveLength(25);
    expect(questions.every((question) => question.operation === 'mul' && question.left >= 1 && question.left <= 10 && question.right <= 10)).toBe(true);
    const facts = questions.map((question) => `${Math.min(question.left, question.right)}x${Math.max(question.left, question.right)}`);
    expect(new Set(facts).size).toBe(facts.length);
  });

  it('never asks the same table twice in a row', () => {
    const questions = planTables(history, seeded(8), NOW, 25);
    expect(questions.every((question, index) => index === 0 || question.left !== questions[index - 1]!.left)).toBe(true);
  });

  it('brings a difficult table back far more often than a mastered one', () => {
    const asked = (table: number) =>
      Array.from({ length: 40 }, (_, seed) => planTables(history, seeded(seed + 1), NOW, 10))
        .flat()
        .filter((question) => question.left === table).length;
    expect(asked(7)).toBeGreaterThan(3 * asked(2));
  });
});
