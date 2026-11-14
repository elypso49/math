import type { Child, ChildInput, Family, Session } from '../../types/math.types';

/** The parent account the family belongs to. */
export interface Account {
  uid: string;
  email: string | null;
  name: string | null;
}

/** Signs the parent in and keeps the session on this device. */
export interface AuthApi {
  /** Account remembered on this device, or null when nobody signed in yet. */
  restore(): Account | null;
  /** Opens the Google sign-in and resolves with the account once the session is open. */
  signIn(): Promise<Account>;
  /** Forgets the session on this device. */
  signOut(): void;
}

/** Reads and writes the data of the signed-in family. */
export interface MathApi {
  /** Loads the family with all its children. */
  getFamily(): Promise<Family>;
  /** Sets the four-digit code opening the parent area. */
  setParentPin(pin: string): Promise<Family>;
  /** Adds a child to the family. */
  createChild(input: ChildInput): Promise<Child>;
  /** Replaces the settings of a child. */
  updateChild(id: string, input: ChildInput): Promise<Child>;
  /** Removes a child and every series it played. */
  deleteChild(id: string): Promise<void>;
  /** Lists every finished series of the family. */
  listSessions(): Promise<Session[]>;
  /** Stores a finished series; storing it again changes nothing. */
  saveSession(session: Session): Promise<Session>;
}
