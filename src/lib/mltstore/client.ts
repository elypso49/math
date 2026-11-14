import { MLTSTORE_URL } from '../config';

type Envelope<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

let tokenProvider: () => string | null = () => null;

/**
 * Tells the client where to read the session token attached to every call.
 * @param provider Returns the current token, or null when signed out.
 */
export const setTokenProvider = (provider: () => string | null) => {
  tokenProvider = provider;
};

const headers = (withBody: boolean) => {
  const result = new Headers();
  const token = tokenProvider();
  if (token)
    result.set('authorization', `Bearer ${token}`);
  if (withBody)
    result.set('content-type', 'application/json');
  return result;
};

/**
 * Calls MltStore and unwraps the { ok, data } envelope.
 * @param method HTTP verb.
 * @param path Path starting with /api.
 * @param body Optional JSON body.
 * @returns The data of a successful envelope.
 * @throws Error carrying the server message when the envelope reports a failure.
 */
export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${MLTSTORE_URL}${path}`, {
      method,
      headers: headers(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Serveur injoignable. Vérifie la connexion.');
  }

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!envelope)
    throw new Error(`MltStore ${method} ${path} : réponse illisible (HTTP ${response.status}).`);
  if (!envelope.ok)
    throw new Error(envelope.error);
  return envelope.data;
}

/** Verbs used by the Math services. */
export const mlt = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
