import type { Operation } from '../../types/math.types';
import { MAX_TABLE, type SkillId } from './skills';

/** The numbers of a calculation, enough to tell which skill it trains. */
export interface Calculation {
  operation: Operation;
  left: number;
  right: number;
}

const units = (value: number) => value % 10;

const additionCategory = ({ left, right }: Calculation): SkillId => {
  if (left >= 100 || right >= 100)
    return 'add:5';
  if (left <= 9 && right <= 9)
    return left + right <= 10 ? 'add:1' : 'add:2';
  return units(left) + units(right) >= 10 ? 'add:4' : 'add:3';
};

const subtractionCategory = ({ left, right }: Calculation): SkillId => {
  if (left >= 100)
    return 'sub:5';
  if (left <= 10)
    return 'sub:1';
  if (right <= 9 && left < 20)
    return 'sub:2';
  return units(right) > units(left) ? 'sub:4' : 'sub:3';
};

const isFact = (first: number, second: number) => first <= MAX_TABLE && second <= MAX_TABLE;

/**
 * Lists the skills a calculation counts toward. A multiplication fact counts for
 * the tables of both its factors: 7 × 8 trains the table of 7 and the table of 8.
 * @param calculation The calculation.
 * @returns One skill, or two for a multiplication fact of two different tables.
 */
export function skillsOfCalculation(calculation: Calculation): SkillId[] {
  const { operation, left, right } = calculation;
  switch (operation) {
    case 'add':
      return [additionCategory(calculation)];
    case 'sub':
      return [subtractionCategory(calculation)];
    case 'mul':
      if (isFact(left, right))
        return [...new Set([`mul:t${left}`, `mul:t${right}`])] as SkillId[];
      return [Math.min(left, right) <= 9 ? 'mul:big1' : 'mul:big2'];
    case 'div':
      return isFact(right, left / right) ? [`div:t${right}`] : ['div:big1'];
  }
}

/**
 * Names the item a calculation belongs to, the unit the spaced repetition
 * schedules: one per fact for tables, one per category otherwise.
 * @param calculation The calculation.
 * @returns For example "mul:7x8", "div:56/7" or "add:4".
 */
export function itemOf(calculation: Calculation): string {
  const { operation, left, right } = calculation;
  if (operation === 'mul' && isFact(left, right))
    return `mul:${Math.min(left, right)}x${Math.max(left, right)}`;
  if (operation === 'div' && isFact(right, left / right))
    return `div:${left}/${right}`;
  return skillsOfCalculation(calculation)[0]!;
}

/**
 * Lists the skills an item counts toward, read from its name alone.
 * @param item Item name, see itemOf.
 * @returns The skills of the fact, or the category itself.
 */
export function skillsOfItem(item: string): SkillId[] {
  const product = item.match(/^mul:(\d+)x(\d+)$/);
  if (product)
    return skillsOfCalculation({ operation: 'mul', left: Number(product[1]), right: Number(product[2]) });
  const quotient = item.match(/^div:(\d+)\/(\d+)$/);
  if (quotient)
    return skillsOfCalculation({ operation: 'div', left: Number(quotient[1]), right: Number(quotient[2]) });
  return [item as SkillId];
}

/**
 * Tells whether an item is a single fact rather than a whole category.
 * @param item Item name.
 * @returns True for "mul:7x8" or "div:56/7".
 */
export const isFactItem = (item: string) => /^(mul:\d+x\d+|div:\d+\/\d+)$/.test(item);

/**
 * Writes an item for the parent.
 * @param item Item name.
 * @param labelOf Label of a category skill.
 * @returns For example "7 × 8", "56 ÷ 7" or the category label.
 */
export function describeItem(item: string, labelOf: (id: SkillId) => string): string {
  const product = item.match(/^mul:(\d+)x(\d+)$/);
  if (product)
    return `${product[1]} × ${product[2]}`;
  const quotient = item.match(/^div:(\d+)\/(\d+)$/);
  if (quotient)
    return `${quotient[1]} ÷ ${quotient[2]}`;
  return labelOf(item as SkillId);
}
