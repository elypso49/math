/**
 * Reads a JSON value from localStorage.
 * @param key Storage key.
 * @returns The parsed value, or null when missing or unreadable.
 */
export function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Writes a JSON value to localStorage.
 * @param key Storage key.
 * @param value Value to serialise.
 */
export const writeJson = (key: string, value: unknown) => window.localStorage.setItem(key, JSON.stringify(value));

/**
 * Removes a key from localStorage.
 * @param key Storage key.
 */
export const removeKey = (key: string) => window.localStorage.removeItem(key);

/**
 * Generates a random identifier.
 * @returns A 32-character hexadecimal string.
 */
export const newId = () => crypto.randomUUID().replaceAll('-', '');
