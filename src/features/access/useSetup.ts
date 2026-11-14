import { useCallback } from 'react';
import { useFamily } from '../family/family.context';
import { useSession } from '../session/session.context';
import { useAccess } from './access.context';

/** Step of the first setup. */
export type SetupStep = 'google' | 'loading' | 'pin' | 'done';

/**
 * Drives the first setup: Google sign-in, then creation of the parent code.
 * @returns The current step, the sign-in state and the actions of each step.
 */
export function useSetup() {
  const { account, signingIn, error: signInError, signIn } = useSession();
  const { status, family, error: loadError, setParentPin, reload } = useFamily();
  const { unlockParent, parentUnlocked } = useAccess();

  const step: SetupStep = !account
    ? 'google'
    : status !== 'ready' || !family
      ? 'loading'
      : family.parentPin
        ? 'done'
        : 'pin';

  const savePin = useCallback(
    async (pin: string) => {
      await setParentPin(pin);
      unlockParent();
      return true;
    },
    [setParentPin, unlockParent],
  );

  return {
    step,
    signingIn,
    error: signInError ?? (status === 'error' ? loadError : null),
    signIn,
    savePin,
    retry: reload,
    parentUnlocked,
  };
}
