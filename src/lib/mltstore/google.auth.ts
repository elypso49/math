import type { Account, AuthApi } from '../api/math.api';
import { GOOGLE_CLIENT_ID } from '../config';
import { readJson, removeKey, writeJson } from '../utils/storage';
import { request, setTokenProvider } from './client';

interface StoredSession {
  token: string;
  expiresAt: string;
  user: Account;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: object): void;
      prompt(listener: (notification: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => void): void;
      renderButton(container: HTMLElement, options: object): void;
      disableAutoSelect(): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const SESSION_KEY = 'math.session';

let gisLoading: Promise<GoogleIdentity> | null = null;

const loadGis = () =>
  (gisLoading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve(window.google!);
    script.onerror = () => reject(new Error('Impossible de charger la connexion Google.'));
    document.head.appendChild(script);
  }));

const restoreSession = (): StoredSession | null => {
  const saved = readJson<StoredSession>(SESSION_KEY);
  if (saved?.token && new Date(saved.expiresAt).getTime() > Date.now())
    return saved;
  removeKey(SESSION_KEY);
  return null;
};

setTokenProvider(() => restoreSession()?.token ?? null);

const exchange = async (credential: string) => {
  const session = await request<StoredSession>('POST', '/api/auth/google', {
    credential,
    requestUri: window.location.origin,
  });
  writeJson(SESSION_KEY, session);
  return session.user;
};

const clickHiddenButton = (google: GoogleIdentity, reject: (reason: Error) => void) => {
  const container = document.createElement('div');
  container.style.display = 'none';
  document.body.appendChild(container);
  google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', type: 'standard' });
  const button = container.querySelector<HTMLElement>('div[role="button"]');
  if (button)
    button.click();
  else
    reject(new Error('La fenêtre de connexion Google a été fermée.'));
};

/**
 * Real Google sign-in: Google Identity Services hands over a credential that
 * MltStore exchanges on /api/auth/google for a session token, kept on this device.
 */
export const googleAuth: AuthApi = {
  restore: () => restoreSession()?.user ?? null,

  signIn: async () => {
    const google = await loadGis();
    return new Promise<Account>((resolve, reject) => {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => exchange(response.credential).then(resolve, reject),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment())
          clickHiddenButton(google, reject);
      });
    });
  },

  signOut: () => {
    removeKey(SESSION_KEY);
    window.google?.accounts?.id?.disableAutoSelect();
  },
};
