import type { Account, AuthApi } from '../api/math.api';
import { readJson, removeKey, writeJson } from '../utils/storage';

const SESSION_KEY = 'math.local.session';

const DEMO_ACCOUNT: Account = { uid: 'local-parent', email: 'parent@exemple.local', name: 'Parent' };

/**
 * Simulated Google sign-in: always opens the same demo account, kept in
 * localStorage like a real session would be.
 */
export const localAuth: AuthApi = {
  restore: () => readJson<Account>(SESSION_KEY),

  signIn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    writeJson(SESSION_KEY, DEMO_ACCOUNT);
    return DEMO_ACCOUNT;
  },

  signOut: () => removeKey(SESSION_KEY),
};

/**
 * Returns the uid of the simulated session.
 * @returns The signed-in uid, or null.
 */
export const localUid = () => localAuth.restore()?.uid ?? null;
