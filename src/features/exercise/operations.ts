import { OPERATIONS, type Operation } from '../../types/math.types';
import { activeOperations, TRAINING_LENGTHS } from './series';

const LOWER_NAMES: Record<Operation, string> = {
  add: 'additions',
  sub: 'soustractions',
  mul: 'multiplications',
  div: 'divisions',
};

/**
 * Describes the operations of a training in plain words.
 * @param operations Operations chosen by the parent.
 * @returns For example "additions et soustractions" or "les 4 opérations".
 */
export function describeOperations(operations: readonly Operation[]): string {
  const chosen = activeOperations(operations);
  if (chosen.length === OPERATIONS.length)
    return 'les 4 opérations';
  const names = chosen.map((operation) => LOWER_NAMES[operation]);
  return names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} et ${names.at(-1)}`;
}

/**
 * Subtitle of the training card.
 * @param operations Operations chosen by the parent.
 * @returns For example "10 à 25 questions · additions et soustractions".
 */
export const trainingSubtitle = (operations: readonly Operation[]) =>
  `${TRAINING_LENGTHS[0]} à ${TRAINING_LENGTHS.at(-1)} questions · ${describeOperations(operations)}`;
