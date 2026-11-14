/** Source of randomness returning a float in [0, 1), injectable for tests. */
export type Random = () => number;

/**
 * Picks an integer between two bounds, both included.
 * @param random Source of randomness.
 * @param min Lowest value.
 * @param max Highest value.
 * @returns An integer in [min, max].
 */
export const between = (random: Random, min: number, max: number): number =>
  min + Math.floor(random() * (max - min + 1));

/**
 * Picks one element of a non-empty list.
 * @param random Source of randomness.
 * @param items Candidates.
 * @returns One of the candidates.
 */
export const pick = <T>(random: Random, items: readonly T[]): T => items[between(random, 0, items.length - 1)]!;

/**
 * Returns a shuffled copy of a list (Fisher-Yates).
 * @param random Source of randomness.
 * @param items List to shuffle, left untouched.
 * @returns A new list holding the same elements in random order.
 */
export function shuffle<T>(random: Random, items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = between(random, 0, index);
    [copy[index], copy[other]] = [copy[other]!, copy[index]!];
  }
  return copy;
}

/**
 * Builds a deterministic generator from a seed (mulberry32).
 * @param seed Any integer.
 * @returns A reproducible source of randomness.
 */
export function seeded(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
