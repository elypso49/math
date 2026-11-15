import { describe, expect, it } from 'vitest';
import type { Answer, Level, Levels, Operation, Session } from '../../types/math.types';
import { createFromItem } from '../exercise/questions';
import { seeded } from '../exercise/random';
import { initialLevels } from '../exercise/series';
import { itemOf, skillsOfCalculation } from './classify';
import { measure, timeline } from './mastery';
import { candidatePool, newItemSlots, planTraining } from './planner';
import { adaptLevels } from './progression';
import { itemStates } from './schedule';

const answer = (operation: Operation, left: number, right: number, correct: boolean, durationMs = 2_000): Answer => {
  const expected = { add: left + right, sub: left - right, mul: left * right, div: left / right }[operation];
  return { operation, level: 1, left, right, expected, given: correct ? expected : expected + 1, correct, durationMs };
};

const session = (finishedAt: string, answers: Answer[], kind: Session['kind'] = 'training'): Session => ({
  id: finishedAt,
  childId: 'child',
  kind,
  startedAt: finishedAt,
  finishedAt,
  durationMs: 0,
  answers,
  changes: [],
});

const NOW = new Date('2026-11-14T12:00:00Z').getTime();

describe('classify', () => {
  it('counts a multiplication fact for both tables', () => {
    expect(skillsOfCalculation({ operation: 'mul', left: 7, right: 8 })).toEqual(['mul:t7', 'mul:t8']);
    expect(itemOf({ operation: 'mul', left: 8, right: 7 })).toBe('mul:7x8');
  });

  it('files divisions under their divisor', () => {
    expect(skillsOfCalculation({ operation: 'div', left: 56, right: 7 })).toEqual(['div:t7']);
    expect(skillsOfCalculation({ operation: 'div', left: 252, right: 4 })).toEqual(['div:big1']);
  });

  it('sorts additions and subtractions by complexity', () => {
    expect(skillsOfCalculation({ operation: 'add', left: 48, right: 17 })).toEqual(['add:4']);
    expect(skillsOfCalculation({ operation: 'add', left: 42, right: 17 })).toEqual(['add:3']);
    expect(skillsOfCalculation({ operation: 'sub', left: 13, right: 5 })).toEqual(['sub:2']);
    expect(skillsOfCalculation({ operation: 'sub', left: 65, right: 28 })).toEqual(['sub:4']);
  });

  it('replays the very same fact', () => {
    const question = createFromItem('mul:7x8', seeded(1));
    expect(question.expected).toBe(56);
    expect([question.left, question.right].sort()).toEqual([7, 8]);
  });
});

describe('measure', () => {
  it('weighs recent answers more', () => {
    const improving = [...Array(4).fill(false), ...Array(4).fill(true)].map((correct) => answer('mul', 7, 8, correct));
    const declining = [...improving].reverse();
    expect(measure(improving, 3_000).accuracy).toBeGreaterThan(measure(declining, 3_000).accuracy);
  });

  it('rates quick and right answers as automatic', () => {
    const result = measure(Array.from({ length: 6 }, () => answer('mul', 7, 8, true, 2_000)), 3_000);
    expect(result.band).toBe('automatic');
    expect(result.speed).toBe(1);
  });

  it('counts a right answer typed after erasing as hesitant', () => {
    const sure = measure(Array.from({ length: 6 }, () => answer('mul', 7, 8, true)), 3_000);
    const hesitant = measure(Array.from({ length: 6 }, () => ({ ...answer('mul', 7, 8, true), erasures: 1 })), 3_000);
    expect(hesitant.accuracy).toBeCloseTo(0.75);
    expect(hesitant.score).toBeLessThan(sure.score);
  });

  it('keeps slow but right answers below automatic', () => {
    const result = measure(Array.from({ length: 6 }, () => answer('mul', 7, 8, true, 8_000)), 3_000);
    expect(result.band).not.toBe('automatic');
  });
});

describe('itemStates', () => {
  it('sends a missed fact back to the first box', () => {
    const history = timeline([
      session('2026-11-10T10:00:00Z', [answer('mul', 7, 8, true), answer('mul', 7, 8, true)]),
      session('2026-11-11T10:00:00Z', [answer('mul', 7, 8, false)]),
    ]);
    expect(itemStates(history).get('mul:7x8')?.box).toBe(1);
  });

  it('spaces a well-known fact further each time', () => {
    const history = timeline([session('2026-11-10T10:00:00Z', [answer('mul', 2, 3, true), answer('mul', 2, 3, true), answer('mul', 2, 3, true)])]);
    const state = itemStates(history).get('mul:2x3')!;
    expect(state.box).toBe(4);
    expect(state.dueAt - state.lastAt).toBe(7 * 86_400_000);
  });
});

describe('planTraining', () => {
  const learner = { operations: ['mul'] as Operation[], levels: { ...initialLevels(), mul: 3 as Level } };

  it('draws only from the open tables', () => {
    const items = candidatePool(learner).map((candidate) => candidate.item);
    expect(items).toContain('mul:9x9');
    expect(items).toContain('mul:3x11');
    expect(items).not.toContain('mul:11x12');
  });

  it('brings a regularly missed table back more often', () => {
    const misses = Array.from({ length: 6 }, (_, index) => answer('mul', 7, index + 2, false));
    const knows = Array.from({ length: 6 }, (_, index) => answer('mul', 2, index + 2, true));
    const history = timeline([session('2026-11-13T10:00:00Z', [...misses, ...knows])]);
    let sevens = 0;
    let twos = 0;
    for (let seed = 0; seed < 40; seed++)
      for (const question of planTraining(learner, history, seeded(seed), NOW, 10)) {
        if (question.left === 7 || question.right === 7)
          sevens++;
        if (question.left === 2 || question.right === 2)
          twos++;
      }
    expect(sevens).toBeGreaterThan(twos * 1.5);
  });

  it('puts the weakest items first in priority and never repeats a fact', () => {
    const history = timeline([session('2026-11-13T10:00:00Z', [answer('mul', 6, 7, false), answer('mul', 3, 4, true)])]);
    const questions = planTraining(learner, history, seeded(3), NOW, 10);
    const items = questions.map(itemOf);
    expect(questions.find((question) => itemOf(question) === 'mul:6x7')?.reason).toBe('weak');
    expect(new Set(items).size).toBe(items.length);
  });

  it('never puts the same item twice in a row', () => {
    const categories = { operations: ['add'] as Operation[], levels: { ...initialLevels(), add: 2 as Level } };
    const items = planTraining(categories, [], seeded(9), NOW, 10).map(itemOf);
    items.slice(1).forEach((item, index) => expect(item).not.toBe(items[index]));
  });

  it('introduces fewer new items while the child struggles', () => {
    const failing = timeline([session('2026-11-13T10:00:00Z', Array.from({ length: 20 }, () => answer('add', 2, 3, false)))]);
    const succeeding = timeline([session('2026-11-13T10:00:00Z', Array.from({ length: 20 }, () => answer('add', 2, 3, true)))]);
    expect(newItemSlots(failing)).toBe(0);
    expect(newItemSlots(succeeding)).toBe(3);
  });
});

describe('adaptLevels', () => {
  const levels: Levels = { ...initialLevels(), mul: 1 };

  it('opens the next tables once those of the level are mastered', () => {
    const answers = [1, 2, 5, 10].flatMap((table) => Array.from({ length: 8 }, (_, index) => answer('mul', table, index + 1, true)));
    const result = adaptLevels(levels, [], answers);
    expect(result.levels.mul).toBe(2);
    expect(result.changes[0]?.reason).toBe('mastered');
  });

  it('waits while one table of the level is still fragile', () => {
    const answers = [
      ...[1, 2, 5].flatMap((table) => Array.from({ length: 6 }, (_, index) => answer('mul', table, index + 1, true))),
      ...Array.from({ length: 6 }, (_, index) => answer('mul', 10, index + 3, index % 2 === 0)),
    ];
    expect(adaptLevels(levels, [], answers).changes).toEqual([]);
  });

  it('leaves second chances out of the promotion', () => {
    const answers = [1, 2, 5, 10].flatMap((table) =>
      Array.from({ length: 8 }, (_, index) => ({ ...answer('mul', table, index + 1, true), reason: index === 0 ? 'retry' : 'practice' })),
    );
    expect(adaptLevels(levels, [], answers).changes).toEqual([]);
  });

  it('judges a level only from the answers given since the evaluation that placed it', () => {
    const before = session('2026-11-10T10:00:00Z', Array.from({ length: 8 }, () => answer('mul', 3, 4, false)));
    const evaluation = session('2026-11-11T10:00:00Z', [answer('mul', 3, 4, true)], 'evaluation');
    expect(adaptLevels({ ...initialLevels(), mul: 2 }, [before, evaluation], []).changes).toEqual([]);
  });

  it('steps back when the new tables stay under 60 % right', () => {
    const answers = Array.from({ length: 8 }, (_, index) => answer('mul', 3 + (index % 2), index + 2, index < 2));
    const result = adaptLevels({ ...initialLevels(), mul: 2 }, [], answers);
    expect(result.levels.mul).toBe(1);
    expect(result.changes[0]?.reason).toBe('struggling');
  });

  it('ignores answers given before the last change', () => {
    const before = session('2026-11-10T10:00:00Z', Array.from({ length: 8 }, () => answer('mul', 3, 4, false)));
    const changed = { ...session('2026-11-11T10:00:00Z', []), changes: [{ operation: 'mul' as const, from: 1 as const, to: 2 as const, reason: 'mastered' as const }] };
    expect(adaptLevels({ ...initialLevels(), mul: 2 }, [before, changed], []).changes).toEqual([]);
  });
});
