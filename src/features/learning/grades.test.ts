import { describe, expect, it } from 'vitest';
import type { Answer, Operation } from '../../types/math.types';
import { expectedSkills, gradeProgress } from './grades';

const answer = (operation: Operation, left: number, right: number, correct: boolean, durationMs: number): Answer => {
  const expected = { add: left + right, sub: left - right, mul: left * right, div: left / right }[operation];
  return { operation, level: 1, left, right, expected, given: correct ? expected : -1, correct, durationMs };
};

const repeat = (count: number, make: () => Answer) => Array.from({ length: count }, make);

const additionsUpToCp = (durationMs: number) => [
  ...repeat(8, () => answer('add', 3, 4, true, durationMs)),
  ...repeat(8, () => answer('add', 7, 8, true, durationMs)),
];

describe('expectedSkills', () => {
  it('adds up the skills of every earlier school year, for the chosen operations', () => {
    expect(expectedSkills('cp', ['add']).map((skill) => skill.id)).toEqual(['add:1', 'add:2']);
    expect(expectedSkills('ce1', ['mul']).map((skill) => skill.id)).toEqual(['mul:t1', 'mul:t2', 'mul:t5', 'mul:t10']);
  });

  it('expects nothing of an operation not yet taught', () => {
    expect(gradeProgress('cp', ['mul'], []).share).toBeNull();
  });
});

describe('gradeProgress', () => {
  it('counts an unseen skill as not met', () => {
    const progress = gradeProgress('cp', ['add'], repeat(8, () => answer('add', 3, 4, true, 2_000)));
    expect(progress.share).toBeCloseTo(0.5);
    expect(progress.measured).toBe(1);
    expect(progress.expected).toBe(2);
  });

  it('allows a younger child more time for the same answers', () => {
    const slow = additionsUpToCp(7_000);
    expect(gradeProgress('cp', ['add'], slow).share).toBe(1);
    expect(gradeProgress('tle', ['add'], slow).share!).toBeLessThan(0.5);
  });

  it('places a child ahead of their school year at the highest year they meet', () => {
    const fluent = [
      ...additionsUpToCp(1_500),
      ...repeat(8, () => answer('add', 23, 14, true, 4_000)),
      ...repeat(8, () => answer('add', 27, 15, true, 6_000)),
    ];
    const progress = gradeProgress('cp', ['add'], fluent);
    expect(progress.share).toBe(1);
    expect(progress.beyond?.id).toBe('ce2');
  });

  it('places nobody beyond their year while it is not met', () => {
    expect(gradeProgress('ce1', ['add'], additionsUpToCp(1_500)).beyond).toBeNull();
  });
});
