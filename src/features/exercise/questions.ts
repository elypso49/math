import type { Level, Operation } from '../../types/math.types';
import { frontierSkills, MAX_TABLE, skill, type SkillId } from '../learning/skills';
import { between, pick, type Random } from './random';

/** Why a question was put in the series. */
export type QuestionReason = 'weak' | 'due' | 'new' | 'practice' | 'retry' | 'evaluation';

/** Operand hidden in a calculation with a blank, the child finding it from the result. */
export type Blank = 'left' | 'right';

/** A calculation to solve. */
export interface Question {
  operation: Operation;
  level: Level;
  left: number;
  right: number;
  /** The number the child must type: the result, or the hidden operand. */
  expected: number;
  /** Hidden operand, for a calculation with a blank. */
  blank?: Blank;
  reason?: QuestionReason;
}

type Calculation = Pick<Question, 'operation' | 'left' | 'right'> & { blank?: Blank };

/** Sign displayed for each operation. */
export const SYMBOLS: Record<Operation, string> = { add: '+', sub: '−', mul: '×', div: '÷' };

type Pair = [number, number];

const retry = (random: Random, draw: (random: Random) => Pair, accept: (pair: Pair) => boolean): Pair => {
  for (;;) {
    const pair = draw(random);
    if (accept(pair))
      return pair;
  }
};

const units = (value: number) => value % 10;

const additions: Record<Level, (random: Random) => Pair> = {
  1: (random) => retry(random, (r) => [between(r, 1, 9), between(r, 1, 9)], ([a, b]) => a + b <= 10),
  2: (random) => retry(random, (r) => [between(r, 2, 9), between(r, 2, 9)], ([a, b]) => a + b > 10),
  3: (random) =>
    retry(random, (r) => [between(r, 10, 89), between(r, 10, 89)], ([a, b]) => units(a) + units(b) < 10 && a + b < 100),
  4: (random) => retry(random, (r) => [between(r, 15, 89), between(r, 15, 89)], ([a, b]) => units(a) + units(b) >= 10),
  5: (random) => retry(random, (r) => [between(r, 100, 899), between(r, 100, 899)], ([a, b]) => a + b <= 999),
};

const subtractions: Record<Level, (random: Random) => Pair> = {
  1: (random) => {
    const left = between(random, 2, 10);
    return [left, between(random, 1, left)];
  },
  2: (random) => retry(random, (r) => [between(r, 11, 18), between(r, 2, 9)], ([a, b]) => a - b < 10),
  3: (random) =>
    retry(random, (r) => [between(r, 20, 99), between(r, 10, 98)], ([a, b]) => b < a && units(b) <= units(a)),
  4: (random) =>
    retry(random, (r) => [between(r, 30, 99), between(r, 11, 98)], ([a, b]) => b < a && units(b) > units(a)),
  5: (random) => {
    const left = between(random, 200, 999);
    return [left, between(random, 100, left - 1)];
  },
};

const product = (random: Random, first: number, second: number): Pair =>
  random() < 0.5 ? [first, second] : [second, first];

const build = (operation: Operation, level: Level, [left, right]: Pair): Question => {
  const expected = { add: left + right, sub: left - right, mul: left * right, div: left / right }[operation];
  return { operation, level, left, right, expected };
};

const pairOf = (id: SkillId, random: Random): Pair => {
  const { operation, level, table } = skill(id);
  if (table && operation === 'mul')
    return product(random, table, between(random, 1, MAX_TABLE));
  if (table && operation === 'div')
    return [table * between(random, 1, MAX_TABLE), table];
  switch (id) {
    case 'mul:big1':
      return product(random, between(random, 13, 25), between(random, 2, 9));
    case 'mul:big2':
      return product(random, between(random, 13, 30), between(random, 11, 15));
    case 'div:big1': {
      const divisor = between(random, 3, 9);
      return [divisor * between(random, 13, 99), divisor];
    }
    default:
      return operation === 'add' ? additions[level](random) : subtractions[level](random);
  }
};

/**
 * Draws a calculation training one skill.
 * @param id The skill.
 * @param random Source of randomness.
 * @returns The question, at the level the skill belongs to.
 */
export const createFromSkill = (id: SkillId, random: Random): Question => {
  const { operation, level } = skill(id);
  return build(operation, level, pairOf(id, random));
};

/**
 * Draws a calculation for a scheduled item: the very same fact for a table
 * fact (factors in a random order), a fresh calculation for a category.
 * @param item Item name, see itemOf.
 * @param random Source of randomness.
 * @returns The question.
 */
export function createFromItem(item: string, random: Random): Question {
  const factor = item.match(/^mul:(\d+)x(\d+)$/);
  if (factor) {
    const [first, second] = [Number(factor[1]), Number(factor[2])];
    return build('mul', skill(`mul:t${Math.max(first, second)}`).level, product(random, first, second));
  }
  const quotient = item.match(/^div:(\d+)\/(\d+)$/);
  if (quotient)
    return build('div', skill(`div:t${Number(quotient[2])}`).level, [Number(quotient[1]), Number(quotient[2])]);
  return createFromSkill(item as SkillId, random);
}

/**
 * Builds a multiplication fact with the table on the left.
 * @param table The table practised.
 * @param multiplier The other factor.
 * @returns The question.
 */
export const createTableFact = (table: number, multiplier: number): Question =>
  build('mul', skill(`mul:t${Math.max(table, multiplier)}`).level, [table, multiplier]);

/**
 * Draws a calculation of the given operation and difficulty, from one of the
 * skills that level introduces. Subtractions never go below zero and divisions
 * always fall right.
 * @param operation Operation to practise.
 * @param level Difficulty, from 1 to 5.
 * @param random Source of randomness.
 * @returns The question with its expected result.
 */
export const createQuestion = (operation: Operation, level: Level, random: Random): Question =>
  createFromSkill(pick(random, frontierSkills(operation, level)).id, random);

/**
 * Computes the result of a calculation, whatever is hidden.
 * @param calculation Operation and operands.
 * @returns For example 42 for 65 − 23.
 */
export const resultOf = ({ operation, left, right }: Calculation) =>
  ({ add: left + right, sub: left - right, mul: left * right, div: left / right })[operation];

/**
 * Hides one operand of a calculation, picked at random: the child then finds it from the result.
 * @param question Calculation to turn into a calculation with a blank.
 * @param random Source of randomness.
 * @returns The same calculation, the hidden operand as the expected answer.
 */
export function withBlank(question: Question, random: Random): Question {
  const blank: Blank = random() < 0.5 ? 'left' : 'right';
  return { ...question, blank, expected: question[blank] };
}

const written = (calculation: Calculation, shown: string) => {
  const left = calculation.blank === 'left' ? shown : calculation.left;
  const right = calculation.blank === 'right' ? shown : calculation.right;
  return `${left} ${SYMBOLS[calculation.operation]} ${right} = ${resultOf(calculation)}`;
};

/**
 * Writes a question the way it is listed, the blank shown as a question mark.
 * @param question Question to format.
 * @returns For example "65 − 23", or "3 + ? = 9" for a calculation with a blank.
 */
export const formatQuestion = (question: Calculation) =>
  question.blank ? written(question, '?') : `${question.left} ${SYMBOLS[question.operation]} ${question.right}`;

/**
 * Writes a question with a number in place of its answer.
 * @param question Question to format.
 * @param value Number written in the answer place.
 * @returns For example "65 − 23 = 42", or "3 + 6 = 9" for a calculation with a blank.
 */
export const formatWith = (question: Calculation, value: number) =>
  question.blank ? written(question, String(value)) : `${formatQuestion(question)} = ${value}`;
