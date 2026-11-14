import type { Child, ChildInput, Family, Session } from '../../types/math.types';
import type { MathApi } from '../api/math.api';
import { newId, readJson, writeJson } from '../utils/storage';
import { localUid } from './local.auth';

interface LocalDatabase {
  parentPin: string | null;
  children: Child[];
  sessions: Session[];
}

const databaseKey = () => {
  const uid = localUid();
  if (!uid)
    throw new Error('Aucun compte parent n’est connecté.');
  return `math.local.db.${uid}`;
};

const load = (): LocalDatabase => readJson<LocalDatabase>(databaseKey()) ?? { parentPin: null, children: [], sessions: [] };

const save = (database: LocalDatabase) => writeJson(databaseKey(), database);

const update = <T>(change: (database: LocalDatabase) => T): Promise<T> => {
  const database = load();
  const result = change(database);
  save(database);
  return Promise.resolve(structuredClone(result));
};

const findChild = (database: LocalDatabase, id: string) => {
  const child = database.children.find((candidate) => candidate.id === id);
  if (!child)
    throw new Error('Cet enfant n’existe plus.');
  return child;
};

/**
 * Simulated MltStore: the same contract as the Math module, kept in this
 * browser's localStorage, one database per parent account.
 */
export const localService: MathApi = {
  getFamily: () => update(({ parentPin, children }): Family => ({ parentPin, children })),

  setParentPin: (pin) =>
    update((database): Family => {
      database.parentPin = pin;
      return { parentPin: pin, children: database.children };
    }),

  createChild: (input: ChildInput) =>
    update((database) => {
      const now = new Date().toISOString();
      const child: Child = { ...input, id: newId(), createdAt: now, updatedAt: now };
      database.children.push(child);
      return child;
    }),

  updateChild: (id, input) =>
    update((database) => {
      const child = findChild(database, id);
      Object.assign(child, input, { updatedAt: new Date().toISOString() });
      return child;
    }),

  deleteChild: (id) =>
    update((database) => {
      findChild(database, id);
      database.children = database.children.filter((child) => child.id !== id);
      database.sessions = database.sessions.filter((session) => session.childId !== id);
    }),

  listSessions: () => update((database) => database.sessions),

  saveSession: (session) =>
    update((database) => {
      findChild(database, session.childId);
      const existing = database.sessions.find((candidate) => candidate.id === session.id);
      if (existing)
        return existing;
      database.sessions.push(session);
      return session;
    }),
};
