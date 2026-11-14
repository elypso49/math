import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { useAccess } from '../features/access/access.context';
import { useChild, useFamily } from '../features/family/family.context';
import type { Child } from '../types/math.types';

/**
 * Centered message filling the screen while data loads or after a failure.
 * @param props Message and optional retry action.
 */
export function StatusScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Screen className="items-center justify-center text-center">
      <p className="m-0 text-lg text-muted">{message}</p>
      {onRetry && <Button onClick={onRetry}>Réessayer</Button>}
    </Screen>
  );
}

/**
 * Lets the page through once the family of a configured account is loaded,
 * and sends a device without account or parent code to the first setup.
 * @param props The protected page.
 */
export function RequireFamily({ children }: { children: ReactNode }) {
  const { status, error, family, reload } = useFamily();
  if (status === 'signed-out')
    return <Navigate to="/setup" replace />;
  if (status === 'error')
    return <StatusScreen message={error ?? 'Le chargement a échoué.'} onRetry={() => void reload()} />;
  if (status === 'loading' || !family)
    return <StatusScreen message="Chargement…" />;
  if (!family.parentPin)
    return <Navigate to="/setup" replace />;
  return children;
}

/**
 * Lets the page through when a child profile is open.
 * @param props Renders the page for the open child.
 */
export function RequireChild({ children }: { children: (child: Child) => ReactNode }) {
  const { childId } = useAccess();
  const child = useChild(childId);
  return child ? children(child) : <Navigate to="/" replace />;
}

/**
 * Lets the page through once the parent code has been typed.
 * @param props The parent page.
 */
export function RequireParent({ children }: { children: ReactNode }) {
  const { parentUnlocked } = useAccess();
  const location = useLocation();
  return parentUnlocked ? children : <Navigate to={`/parent/pin?next=${encodeURIComponent(location.pathname)}`} replace />;
}
