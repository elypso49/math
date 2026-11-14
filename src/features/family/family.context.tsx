import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../../lib/api';
import type { Child, ChildInput, Family, Levels, Session } from '../../types/math.types';
import { DEFAULT_OPERATIONS, initialLevels } from '../exercise/series';
import { useSession } from '../session/session.context';

/** Loading state of the family data. */
export type FamilyStatus = 'signed-out' | 'loading' | 'ready' | 'error';

/** Family data of the signed-in parent and the actions on it. */
export interface FamilyValue {
  status: FamilyStatus;
  error: string | null;
  family: Family | null;
  sessions: Session[];
  reload: () => Promise<void>;
  setParentPin: (pin: string) => Promise<void>;
  addChild: (name: string) => Promise<Child>;
  saveChild: (child: Child, changes: Partial<ChildInput>) => Promise<void>;
  removeChild: (id: string) => Promise<void>;
  recordSession: (session: Session, levels: Levels) => Promise<void>;
}

const FamilyContext = createContext<FamilyValue | null>(null);

const toInput = ({ name, pin, colour, operations, levels }: Child): ChildInput => ({ name, pin, colour, operations, levels });

const sameLevels = (left: Levels, right: Levels) =>
  left.add === right.add && left.sub === right.sub && left.mul === right.mul && left.div === right.div;

/**
 * Loads the family of the signed-in parent and keeps it in step with every write.
 * @param props The application tree.
 */
export function FamilyProvider({ children }: { children: ReactNode }) {
  const { account } = useSession();
  const [status, setStatus] = useState<FamilyStatus>(account ? 'loading' : 'signed-out');
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const [loadedFamily, loadedSessions] = await Promise.all([api.getFamily(), api.listSessions()]);
      setFamily(loadedFamily);
      setSessions(loadedSessions);
      setStatus('ready');
    } catch (failure) {
      setError((failure as Error).message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (account) {
      void reload();
      return;
    }
    setFamily(null);
    setSessions([]);
    setStatus('signed-out');
  }, [account, reload]);

  const replaceChild = (updated: Child) =>
    setFamily((current) =>
      current && { ...current, children: current.children.map((child) => (child.id === updated.id ? updated : child)) },
    );

  const setParentPin = useCallback(async (pin: string) => setFamily(await api.setParentPin(pin)), []);

  const addChild = useCallback(
    async (name: string) => {
      const created = await api.createChild({
        name: name.trim(),
        pin: null,
        colour: family?.children.length ?? 0,
        operations: DEFAULT_OPERATIONS,
        levels: initialLevels(),
      });
      setFamily((current) => current && { ...current, children: [...current.children, created] });
      return created;
    },
    [family?.children.length],
  );

  const saveChild = useCallback(async (child: Child, changes: Partial<ChildInput>) => {
    replaceChild(await api.updateChild(child.id, { ...toInput(child), ...changes }));
  }, []);

  const removeChild = useCallback(async (id: string) => {
    await api.deleteChild(id);
    setFamily((current) => current && { ...current, children: current.children.filter((child) => child.id !== id) });
    setSessions((current) => current.filter((session) => session.childId !== id));
  }, []);

  const recordSession = useCallback(
    async (session: Session, levels: Levels) => {
      const saved = await api.saveSession(session);
      setSessions((current) => [...current.filter((existing) => existing.id !== saved.id), saved]);
      const child = family?.children.find((candidate) => candidate.id === session.childId);
      if (child && !sameLevels(child.levels, levels))
        replaceChild(await api.updateChild(child.id, { ...toInput(child), levels }));
    },
    [family],
  );

  const value = useMemo(
    () => ({ status, error, family, sessions, reload, setParentPin, addChild, saveChild, removeChild, recordSession }),
    [status, error, family, sessions, reload, setParentPin, addChild, saveChild, removeChild, recordSession],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

/**
 * Reads the family data.
 * @returns The family, its sessions and the actions on them.
 */
export function useFamily(): FamilyValue {
  const value = useContext(FamilyContext);
  if (!value)
    throw new Error('useFamily doit être utilisé sous FamilyProvider.');
  return value;
}

/**
 * Finds a child of the family.
 * @param id Identifier of the child, or null.
 * @returns The child, or null when unknown.
 */
export function useChild(id: string | null): Child | null {
  const { family } = useFamily();
  return family?.children.find((child) => child.id === id) ?? null;
}

/**
 * Lists the sessions of one child.
 * @param childId Identifier of the child.
 * @returns Its sessions, oldest first.
 */
export function useChildSessions(childId: string | null): Session[] {
  const { sessions } = useFamily();
  return useMemo(
    () =>
      sessions
        .filter((session) => session.childId === childId)
        .sort((left, right) => left.finishedAt.localeCompare(right.finishedAt)),
    [sessions, childId],
  );
}
