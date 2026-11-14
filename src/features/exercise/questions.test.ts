import { describe, expect, it } from 'vitest';
import { OPERATIONS, type Level } from '../../types/math.types';
import { createQuestion, formatQuestion, formatWith, resultOf, withBlank, type Question } from './questions';
import { seeded } from './random';
import { buildEvaluation, EVALUATION_LENGTH } from './series';

const LEVELS: Level[] = [1, 2, 3, 4, 5];

describe('createQuestion', () => {
  it.each(OPERATIONS.flatMap((operation) => LEVELS.map((level) => [operation, level] as const)))(
    'gives a right expected result for %s at level %i',
    (operation, level) => {
      const random = seeded(level * 97);
      for (let draw = 0; draw < 300; draw++) {
        const question = createQuestion(operation, level, random);
        const { left, right, expected } = question;
        const computed = { add: left + right, sub: left - right, mul: left * right, div: left / right }[operation];
        expect(expected).toBe(computed);
        expect(Number.isInteger(expected)).toBe(true);
        expect(expected).toBeGreaterThanOrEqual(0);
        expect(String(expected).length).toBeLessThanOrEqual(4);
      }
    },
  );

  it('keeps level 1 additions within ten', () => {
    const random = seeded(1);
    for (let draw = 0; draw < 200; draw++)
      expect(createQuestion('add', 1, random).expected).toBeLessThanOrEqual(10);
  });

  it('makes level 4 additions carry over', () => {
    const random = seeded(4);
    for (let draw = 0; draw < 200; draw++) {
      const { left, right } = createQuestion('add', 4, random);
      expect((left % 10) + (right % 10)).toBeGreaterThanOrEqual(10);
    }
  });

  it('makes level 4 subtractions borrow', () => {
    const random = seeded(8);
    for (let draw = 0; draw < 200; draw++) {
      const { left, right } = createQuestion('sub', 4, random);
      expect(right % 10).toBeGreaterThan(left % 10);
    }
  });
});

describe('formatQuestion', () => {
  it('uses the typographic signs', () => {
    expect(formatQuestion({ operation: 'sub', left: 65, right: 23 })).toBe('65 − 23');
    expect(formatQuestion({ operation: 'div', left: 56, right: 7 })).toBe('56 ÷ 7');
  });
});

describe('evaluation', () => {
  it('asks every operation at every level', () => {
    const questions = buildEvaluation(seeded(11), ['add', 'sub', 'mul', 'div']);
    expect(questions).toHaveLength(EVALUATION_LENGTH);
    for (const operation of OPERATIONS)
      for (const level of LEVELS)
        expect(questions.some((question) => question.operation === operation && question.level === level)).toBe(true);
  });

  it('asks only the operations the parent turned on, still at every level', () => {
    const questions = buildEvaluation(seeded(5), ['add', 'sub', 'mul']);
    expect(questions).toHaveLength(EVALUATION_LENGTH);
    expect(questions.some((question) => question.operation === 'div')).toBe(false);
    for (const operation of ['add', 'sub', 'mul'] as const)
      for (const level of LEVELS)
        expect(questions.some((question) => question.operation === operation && question.level === level)).toBe(true);
  });
});

describe('withBlank', () => {
  const sum: Question = { operation: 'add', level: 1, left: 3, right: 6, expected: 9 };

  it('hides one operand and expects it as the answer', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const question = withBlank(sum, seeded(seed));
      expect(question.expected).toBe(question.blank === 'left' ? 3 : 6);
      expect(resultOf(question)).toBe(9);
    }
  });

  it('writes the blank as a question mark, and the answer in its place', () => {
    const question: Question = { ...sum, blank: 'right', expected: 6 };
    expect(formatQuestion(question)).toBe('3 + ? = 9');
    expect(formatWith(question, 5)).toBe('3 + 5 = 9');
    expect(formatWith(sum, 9)).toBe('3 + 6 = 9');
  });
});
