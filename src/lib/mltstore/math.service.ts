import type { Child, Family, Session } from '../../types/math.types';
import type { MathApi } from '../api/math.api';
import { mlt } from './client';

/**
 * Math module of MltStore (/api/maths). The wire format is the domain model
 * itself, camelCase, so nothing needs mapping.
 */
export const mltstoreService: MathApi = {
  getFamily: () => mlt.get<Family>('/api/maths/family'),
  setParentPin: (pin) => mlt.put<Family>('/api/maths/family/parent-pin', { pin }),
  createChild: (input) => mlt.post<Child>('/api/maths/children', input),
  updateChild: (id, input) => mlt.put<Child>(`/api/maths/children/${encodeURIComponent(id)}`, input),
  deleteChild: async (id) => {
    await mlt.delete(`/api/maths/children/${encodeURIComponent(id)}`);
  },
  listSessions: () => mlt.get<Session[]>('/api/maths/sessions'),
  saveSession: (session) => mlt.post<Session>('/api/maths/sessions', session),
};
