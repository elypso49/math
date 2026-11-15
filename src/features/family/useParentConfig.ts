import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Child, Grade, Operation } from '../../types/math.types';
import { useAccess } from '../access/access.context';
import { useSession } from '../session/session.context';
import { useFamily } from './family.context';

/**
 * Draws a random four-digit code.
 * @returns For example "0427".
 */
export const randomPin = () => String(Math.floor(Math.random() * 10_000)).padStart(4, '0');

/**
 * Actions of the parent configuration screen, each reporting its failure in a
 * single error message.
 * @returns The family, the edit actions and the pending and error states.
 */
export function useParentConfig() {
  const { family, setParentPin, addChild, saveChild, removeChild } = useFamily();
  const { lockParent } = useAccess();
  const { signOut } = useSession();
  const [params] = useSearchParams();
  const [adding, setAdding] = useState(params.get('add') === '1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (failure) {
      setError((failure as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const toggleOperation = (child: Child, operation: Operation) => {
    const operations = child.operations.includes(operation)
      ? child.operations.filter((existing) => existing !== operation)
      : [...child.operations, operation];
    return operations.length === 0 ? Promise.resolve(false) : run(() => saveChild(child, { operations }));
  };

  return {
    children: family?.children ?? [],
    parentPin: family?.parentPin ?? null,
    busy,
    error,
    adding,
    setAdding,
    signOutDevice: () => {
      lockParent();
      signOut();
    },
    addChild: (name: string) => run(() => addChild(name)).then((done) => done && setAdding(false)),
    rename: (child: Child, name: string) => run(() => saveChild(child, { name: name.trim() })),
    setPin: (child: Child, pin: string | null) => run(() => saveChild(child, { pin })),
    setGrade: (child: Child, grade: Grade | null) => run(() => saveChild(child, { grade })),
    toggleOperation,
    remove: (child: Child) => run(() => removeChild(child.id)),
    changeParentPin: (pin: string) => run(() => setParentPin(pin)),
  };
}
