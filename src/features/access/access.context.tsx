import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/** Who is using the device right now. */
export interface AccessValue {
  /** Child whose profile is open, or null on the profile picker. */
  childId: string | null;
  /** True once the parent code has been typed, until the parent area is locked again. */
  parentUnlocked: boolean;
  enterChild: (id: string) => void;
  leaveChild: () => void;
  unlockParent: () => void;
  lockParent: () => void;
}

const CHILD_KEY = 'math.activeChild';

const AccessContext = createContext<AccessValue | null>(null);

const readChild = () => {
  try {
    return window.sessionStorage.getItem(CHILD_KEY);
  } catch {
    return null;
  }
};

const writeChild = (id: string | null) => {
  try {
    if (id)
      window.sessionStorage.setItem(CHILD_KEY, id);
    else
      window.sessionStorage.removeItem(CHILD_KEY);
  } catch {
    return;
  }
};

/**
 * Tracks the open child profile (kept across reloads of the tab) and whether
 * the parent area is unlocked (forgotten on reload, so the code is asked again).
 * @param props The application tree.
 */
export function AccessProvider({ children }: { children: ReactNode }) {
  const [childId, setChildId] = useState<string | null>(readChild);
  const [parentUnlocked, setParentUnlocked] = useState(false);

  const enterChild = useCallback((id: string) => {
    writeChild(id);
    setChildId(id);
    setParentUnlocked(false);
  }, []);

  const leaveChild = useCallback(() => {
    writeChild(null);
    setChildId(null);
  }, []);

  const unlockParent = useCallback(() => setParentUnlocked(true), []);
  const lockParent = useCallback(() => setParentUnlocked(false), []);

  const value = useMemo(
    () => ({ childId, parentUnlocked, enterChild, leaveChild, unlockParent, lockParent }),
    [childId, parentUnlocked, enterChild, leaveChild, unlockParent, lockParent],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

/**
 * Reads who is using the device.
 * @returns The open profile and the actions to switch.
 */
export function useAccess(): AccessValue {
  const value = useContext(AccessContext);
  if (!value)
    throw new Error('useAccess doit être utilisé sous AccessProvider.');
  return value;
}
