/** Where the app reads its data and signs the parent in. */
export type DataMode = 'local' | 'mltstore';

const rawMode = import.meta.env.VITE_DATA_MODE as string | undefined;

/** Active data mode; local simulation unless MltStore is asked for explicitly. */
export const DATA_MODE: DataMode = rawMode === 'mltstore' ? 'mltstore' : 'local';

/** MltStore origin, empty when /api is served same-origin. */
export const MLTSTORE_URL = ((import.meta.env.VITE_MLTSTORE_URL as string | undefined) ?? '').replace(/\/+$/, '');

/** Public Google OAuth Web client ID shared by the MltStore apps. */
export const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
  '771821512994-a3mil924i87nnsf9srsoocr16nbjhebu.apps.googleusercontent.com';
