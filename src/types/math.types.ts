/** One of the four arithmetic operations practised in the app. */
export type Operation = 'add' | 'sub' | 'mul' | 'div';

/** Every operation, in the order they are taught. */
export const OPERATIONS: readonly Operation[] = ['add', 'sub', 'mul', 'div'];

/** Difficulty level of an operation, from 1 (beginner) to 5 (expert). */
export type Level = 1 | 2 | 3 | 4 | 5;

/** Lowest difficulty level. */
export const MIN_LEVEL: Level = 1;

/** Highest difficulty level. */
export const MAX_LEVEL: Level = 5;

/** Current difficulty of each operation for one child. */
export type Levels = Record<Operation, Level>;

/** A child profile of the family. */
export interface Child {
  id: string;
  name: string;
  /** Four-digit secret code, or null when the profile opens without one. */
  pin: string | null;
  /** Index into the avatar palette. */
  colour: number;
  /** Operations included in the training series. */
  operations: Operation[];
  levels: Levels;
  createdAt: string;
  updatedAt: string;
}

/** What the parent can set on a child profile. */
export interface ChildInput {
  name: string;
  pin: string | null;
  colour: number;
  operations: Operation[];
  levels: Levels;
}

/** The family account, owned by the parent who signed in with Google. */
export interface Family {
  /** Four-digit code opening the parent area, or null before the first setup. */
  parentPin: string | null;
  children: Child[];
}

/** A ten-question practice series or a twenty-five-question evaluation. */
export type SessionKind = 'training' | 'evaluation' | 'tables' | 'blanks';

/** One answered question of a session. */
export interface Answer {
  operation: Operation;
  level: Level;
  left: number;
  right: number;
  expected: number;
  given: number;
  correct: boolean;
  /** Time from the question appearing to the answer being validated. */
  durationMs: number;
  /** Time from the question appearing to the first digit typed. */
  thinkMs?: number;
  /** Time spent reading the verdict before moving on. */
  reviewMs?: number;
  /** Digits erased before validating, a sign of hesitation. */
  erasures?: number;
  /** Why the question was in the series: weak, due, new, practice, retry or evaluation. */
  reason?: string;
  /** The child gave up with « C'est trop dur »; the answer counts as wrong. */
  skipped?: boolean;
  /** Operand hidden in a calculation with a blank; expected is then that operand. */
  blank?: 'left' | 'right';
}

/** A finished series, stored once the child reaches the summary. */
export interface Session {
  id: string;
  childId: string;
  kind: SessionKind;
  startedAt: string;
  finishedAt: string;
  /** Sum of the answer times. */
  durationMs: number;
  /** Wall-clock time from the first question to the summary, verdicts included. */
  elapsedMs?: number;
  answers: Answer[];
  /** Levels moved by the adaptation at the end of the series. */
  changes: LevelChange[];
}

/** Why the level of an operation moved after a training. */
export type ChangeReason = 'mastered' | 'slow' | 'struggling';

/** A level moved by the adaptation. */
export interface LevelChange {
  operation: Operation;
  from: Level;
  to: Level;
  reason: ChangeReason;
}
