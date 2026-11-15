import type { Answer, Grade, Operation } from '../../types/math.types';
import { bySkill, measure } from './mastery';
import { skill, type Skill, type SkillId } from './skills';

/** What a school year expects in mental calculation. */
export interface GradeExpectation {
  id: Grade;
  label: string;
  /** Skills that year adds to the earlier ones. */
  adds: readonly SkillId[];
  /** Multiple of each skill's target time still counted as fluent at that age. */
  timeFactor: number;
}

const tables = (operation: 'mul' | 'div', numbers: readonly number[]) => numbers.map((table) => `${operation}:t${table}` as SkillId);

/** Every school year in order, with the skills it expects by its end. */
export const GRADES: readonly GradeExpectation[] = [
  { id: 'mat', label: 'Maternelle', adds: ['add:1'], timeFactor: 3 },
  { id: 'cp', label: 'CP', adds: ['sub:1', 'add:2'], timeFactor: 2.5 },
  { id: 'ce1', label: 'CE1', adds: ['sub:2', 'add:3', 'sub:3', ...tables('mul', [1, 2, 5, 10])], timeFactor: 2 },
  { id: 'ce2', label: 'CE2', adds: ['add:4', 'sub:4', ...tables('mul', [3, 4, 6, 7, 8, 9])], timeFactor: 1.5 },
  { id: 'cm1', label: 'CM1', adds: ['add:5', 'sub:5', 'mul:big1', ...tables('div', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])], timeFactor: 1.2 },
  { id: 'cm2', label: 'CM2', adds: ['div:big1'], timeFactor: 1.2 },
  { id: '6e', label: '6e', adds: ['mul:big2'], timeFactor: 1 },
  { id: '5e', label: '5e', adds: [], timeFactor: 1 },
  { id: '4e', label: '4e', adds: [], timeFactor: 1 },
  { id: '3e', label: '3e', adds: [], timeFactor: 1 },
  { id: '2nde', label: 'Seconde', adds: [], timeFactor: 1 },
  { id: '1re', label: 'Première', adds: [], timeFactor: 1 },
  { id: 'tle', label: 'Terminale', adds: [], timeFactor: 1 },
];

/** Mastery score at which a skill meets what the school year expects. */
export const EXPECTED_SCORE = 0.8;

/** Share of the expectations a child must meet to be placed at a school year. */
export const REACHED_SHARE = 0.9;

/** How a child stands against the expectations of a school year. */
export interface GradeProgress {
  /** Share of the expectations met, from 0 to 1, or null when the year expects nothing yet. */
  share: number | null;
  /** Expected skills the child has already answered. */
  measured: number;
  /** Skills the year expects for the operations considered. */
  expected: number;
  /** Highest school year whose expectations the child meets, when above their own. */
  beyond: GradeExpectation | null;
}

const indexOf = (grade: Grade) => GRADES.findIndex((candidate) => candidate.id === grade);

/**
 * Looks up a school year.
 * @param grade Identifier of the year.
 * @returns Its expectations.
 */
export const gradeOf = (grade: Grade): GradeExpectation => GRADES[indexOf(grade)]!;

/**
 * Lists the skills expected by the end of a school year, earlier years included.
 * @param grade The school year.
 * @param operations Operations considered.
 * @returns The expected skills of those operations.
 */
export const expectedSkills = (grade: Grade, operations: readonly Operation[]): Skill[] =>
  GRADES.slice(0, indexOf(grade) + 1)
    .flatMap((year) => year.adds.map(skill))
    .filter((expected) => operations.includes(expected.operation));

function shareMet(grade: Grade, operations: readonly Operation[], groups: Map<SkillId, Answer[]>) {
  const expected = expectedSkills(grade, operations);
  const { timeFactor } = gradeOf(grade);
  const met = expected.map((candidate) => {
    const answers = groups.get(candidate.id) ?? [];
    return Math.min(1, measure(answers, candidate.targetMs * timeFactor).score / EXPECTED_SCORE);
  });
  return {
    share: expected.length === 0 ? null : met.reduce((total, value) => total + value, 0) / expected.length,
    measured: expected.filter((candidate) => groups.has(candidate.id)).length,
    expected: expected.length,
  };
}

/**
 * Compares a child with what their school year expects: each expected skill
 * counts fully once its mastery reaches 0.8 within the time allowed at that age,
 * and an unseen skill counts for nothing. Once the year is met, the child is
 * placed at the highest year whose expectations they meet in turn.
 * @param grade School year of the child.
 * @param operations Operations considered.
 * @param answers Every answer of the child, oldest first.
 * @returns The share met and, when relevant, the year reached beyond.
 */
export function gradeProgress(grade: Grade, operations: readonly Operation[], answers: readonly Answer[]): GradeProgress {
  const groups = bySkill(answers);
  const own = shareMet(grade, operations, groups);
  if (own.share === null || own.share < REACHED_SHARE)
    return { ...own, beyond: null };

  let reached = indexOf(grade);
  for (let index = reached + 1; index < GRADES.length; index++) {
    const next = shareMet(GRADES[index]!.id, operations, groups);
    if (next.share === null || next.share < REACHED_SHARE)
      break;
    if (GRADES[index]!.adds.length > 0 || GRADES[index]!.timeFactor < GRADES[reached]!.timeFactor)
      reached = index;
  }
  return { ...own, beyond: reached > indexOf(grade) ? GRADES[reached]! : null };
}
