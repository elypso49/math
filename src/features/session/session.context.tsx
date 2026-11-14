import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { auth, type Account } from '../../lib/api';

/** Parent account of this device and the actions on it. */
export interface SessionValue {
  account: Account | null;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<Account | null>;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Holds the parent account remembered on this device.
 * @param props The application tree.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(() => auth.restore());
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setSigningIn(true);
    setError(null);
    try {
      const signedIn = await auth.signIn();
      setAccount(signedIn);
      return signedIn;
    } catch (failure) {
      setError((failure as Error).message);
      return null;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    auth.signOut();
    setAccount(null);
  }, []);

  const value = useMemo(() => ({ account, signingIn, error, signIn, signOut }), [account, signingIn, error, signIn, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Reads the parent session.
 * @returns The account and the sign-in actions.
 */
export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value)
    throw new Error('useSession doit être utilisé sous SessionProvider.');
  return value;
}
