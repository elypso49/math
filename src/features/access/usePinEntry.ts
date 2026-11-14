import { useCallback, useRef, useState } from 'react';

/** Length of every code in the app. */
export const PIN_LENGTH = 4;

/**
 * Checks that a code is made of exactly four digits.
 * @param value Candidate code.
 * @returns True for a valid code.
 */
export const isPin = (value: string) => /^\d{4}$/.test(value);

/**
 * Typing state of a four-digit code on the numeric pad; the code is checked as soon as
 * the fourth digit is typed, and a rejected code is cleared.
 * @param onComplete Called with the full code; returns false to reject it.
 * @returns The digits typed, the pad handlers, and the rejection and busy states.
 */
export function usePinEntry(onComplete: (pin: string) => boolean | Promise<boolean>) {
  const [typed, setTyped] = useState('');
  const [rejected, setRejected] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = useRef('');

  const update = (next: string) => {
    current.current = next;
    setTyped(next);
  };

  const check = useCallback(
    async (pin: string) => {
      setBusy(true);
      try {
        if (await onComplete(pin))
          return;
        update('');
        setRejected(true);
        navigator.vibrate?.(200);
      } finally {
        setBusy(false);
      }
    },
    [onComplete],
  );

  const press = useCallback(
    (digit: string) => {
      if (current.current.length >= PIN_LENGTH)
        return;
      const next = current.current + digit;
      setRejected(false);
      update(next);
      if (next.length === PIN_LENGTH)
        void check(next);
    },
    [check],
  );

  const erase = useCallback(() => {
    if (current.current.length < PIN_LENGTH)
      update(current.current.slice(0, -1));
  }, []);

  return { typed, rejected, busy, press, erase };
}
