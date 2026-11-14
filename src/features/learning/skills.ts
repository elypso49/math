import type { Level, Operation } from '../../types/math.types';

/** A skill tracked on its own: a multiplication or division table, or a complexity category. */
export type SkillId =
  | `add:${1 | 2 | 3 | 4 | 5}`
  | `sub:${1 | 2 | 3 | 4 | 5}`
  | `mul:t${number}`
  | 'mul:big1'
  | 'mul:big2'
  | `div:t${number}`
  | 'div:big1';

/** Description of a skill. */
export interface Skill {
  id: SkillId;
  operation: Operation;
  label: string;
  /** Level of the operation at which the skill enters the training series. */
  level: Level;
  /** Answer time under which the skill counts as automatic, in milliseconds. */
  targetMs: number;
  /** Table number for multiplication and division tables. */
  table?: number;
}

/** Highest table practised. */
export const MAX_TABLE = 12;

/** Answer time of a fact retrieved from memory rather than computed. */
export const FACT_TARGET_MS = 3_000;

const TABLE_LEVELS: Record<number, Level> = { 1: 1, 2: 1, 5: 1, 10: 1, 3: 2, 4: 2, 6: 3, 7: 3, 8: 3, 9: 3, 11: 4, 12: 4 };

const tables = (operation: 'mul' | 'div', label: (table: number) => string): Skill[] =>
  Array.from({ length: MAX_TABLE }, (_, index) => index + 1).map((table) => ({
    id: `${operation}:t${table}` as SkillId,
    operation,
    label: label(table),
    level: TABLE_LEVELS[table]!,
    targetMs: FACT_TARGET_MS,
    table,
  }));

/** Every skill, by operation then difficulty. */
export const SKILLS: readonly Skill[] = [
  { id: 'add:1', operation: 'add', label: 'Sommes jusqu’à 10', level: 1, targetMs: FACT_TARGET_MS },
  { id: 'add:2', operation: 'add', label: 'Passage de la dizaine', level: 2, targetMs: FACT_TARGET_MS },
  { id: 'add:3', operation: 'add', label: '2 chiffres sans retenue', level: 3, targetMs: 8_000 },
  { id: 'add:4', operation: 'add', label: '2 chiffres avec retenue', level: 4, targetMs: 12_000 },
  { id: 'add:5', operation: 'add', label: '3 chiffres', level: 5, targetMs: 20_000 },
  { id: 'sub:1', operation: 'sub', label: 'Différences jusqu’à 10', level: 1, targetMs: FACT_TARGET_MS },
  { id: 'sub:2', operation: 'sub', label: 'Passage de la dizaine', level: 2, targetMs: 4_000 },
  { id: 'sub:3', operation: 'sub', label: '2 chiffres sans retenue', level: 3, targetMs: 10_000 },
  { id: 'sub:4', operation: 'sub', label: '2 chiffres avec retenue', level: 4, targetMs: 15_000 },
  { id: 'sub:5', operation: 'sub', label: '3 chiffres', level: 5, targetMs: 25_000 },
  ...tables('mul', (table) => `Table de ${table}`),
  { id: 'mul:big1', operation: 'mul', label: 'Grand nombre × 1 chiffre', level: 5, targetMs: 15_000 },
  { id: 'mul:big2', operation: 'mul', label: '2 chiffres × 2 chiffres', level: 5, targetMs: 40_000 },
  ...tables('div', (table) => `Divisions par ${table}`),
  { id: 'div:big1', operation: 'div', label: 'Grand nombre ÷ 1 chiffre', level: 5, targetMs: 30_000 },
];

const byId = new Map(SKILLS.map((skill) => [skill.id, skill]));

/**
 * Looks up a skill.
 * @param id Identifier of the skill.
 * @returns Its description.
 */
export const skill = (id: SkillId): Skill => byId.get(id)!;

/**
 * Lists the skills of an operation.
 * @param operation The operation.
 * @returns Its skills, easiest first.
 */
export const skillsOf = (operation: Operation) => SKILLS.filter((candidate) => candidate.operation === operation);

/**
 * Lists the skills open at a level: those it introduces and every easier one.
 * @param operation The operation.
 * @param level Current level of the child.
 * @returns The skills the training series may draw from.
 */
export const unlockedSkills = (operation: Operation, level: Level) =>
  skillsOf(operation).filter((candidate) => candidate.level <= level);

/**
 * Lists the skills a level introduces.
 * @param operation The operation.
 * @param level The level.
 * @returns The new skills of that level.
 */
export const frontierSkills = (operation: Operation, level: Level) =>
  skillsOf(operation).filter((candidate) => candidate.level === level);
