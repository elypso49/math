import { DATA_MODE } from '../config';
import { localAuth } from '../local/local.auth';
import { localService } from '../local/local.service';
import { googleAuth } from '../mltstore/google.auth';
import { mltstoreService } from '../mltstore/math.service';
import type { AuthApi, MathApi } from './math.api';

/** Parent sign-in for the active data mode. */
export const auth: AuthApi = DATA_MODE === 'mltstore' ? googleAuth : localAuth;

/** Family data for the active data mode. */
export const api: MathApi = DATA_MODE === 'mltstore' ? mltstoreService : localService;

export type { Account, AuthApi, MathApi } from './math.api';
