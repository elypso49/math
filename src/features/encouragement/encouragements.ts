import type { Session } from '../../types/math.types';
import { TRAINING_LENGTH } from '../exercise/series';

/** Identifier of an encouragement, matching the file names under assets/icons/encouragement. */
export type EncouragementId =
  | 'serie-parfaite'
  | 'nouveau-record'
  | 'eclair'
  | 'tu-t-ameliores'
  | 'serie-en-feu'
  | 'premiere-serie'
  | 'objectif-atteint'
  | 'pas-lache'
  | 'continue'
  | 'presque';

/** Wording of an encouragement. */
export interface Encouragement {
  id: EncouragementId;
  title: string;
  detail: string;
  /** True when the encouragement is a collectable badge, false for a plain message. */
  badge: boolean;
}

/** Every encouragement, by priority when several are earned at once. */
export const ENCOURAGEMENTS: readonly Encouragement[] = [
  { id: 'serie-parfaite', title: 'Sans faute !', detail: 'Aucune erreur sur toute la série.', badge: true },
  { id: 'nouveau-record', title: 'Nouveau record !', detail: 'C’est ta série la plus rapide.', badge: true },
  { id: 'eclair', title: 'Éclair !', detail: 'Une série sans faute en moins de 18 secondes par calcul.', badge: true },
  { id: 'tu-t-ameliores', title: 'Tu t’améliores !', detail: 'Tu es plus rapide que sur tes dernières séries.', badge: true },
  { id: 'serie-en-feu', title: '3 séries de suite !', detail: 'Trois séries terminées dans la journée.', badge: true },
  { id: 'premiere-serie', title: 'Première série !', detail: 'Ta toute première série est terminée.', badge: true },
  { id: 'objectif-atteint', title: 'Objectif atteint', detail: 'Au moins 80 % de bonnes réponses.', badge: true },
  { id: 'pas-lache', title: 'Tu n’as pas lâché', detail: 'Tu as terminé la série jusqu’au bout.', badge: true },
  { id: 'continue', title: 'Continue comme ça !', detail: 'Chaque série te fait progresser.', badge: false },
  { id: 'presque', title: 'Presque !', detail: 'Encore un petit effort, tu y es presque.', badge: false },
];

/** Under this average time per question, a perfect series earns the lightning badge. */
export const LIGHTNING_MS_PER_QUESTION = 18_000;

const byId = new Map(ENCOURAGEMENTS.map((encouragement) => [encouragement.id, encouragement]));

/**
 * Looks up the wording of an encouragement.
 * @param id Identifier of the encouragement.
 * @returns Its title and detail.
 */
export const encouragement = (id: EncouragementId): Encouragement => byId.get(id)!;

const correctCount = (session: Session) => session.answers.filter((answer) => answer.correct).length;

const averageTime = (session: Session) =>
  session.answers.length === 0 ? 0 : session.durationMs / session.answers.length;

const sameDay = (left: string, right: string) => new Date(left).toDateString() === new Date(right).toDateString();

/**
 * Lists the encouragements a training series earns, by priority. A plain
 * message always closes the list, so there is always something to show.
 * @param session The series just finished.
 * @param previous The child's earlier trainings, oldest first.
 * @returns The identifiers earned, the most rewarding first.
 */
export function earnedFor(session: Session, previous: readonly Session[]): EncouragementId[] {
  const correct = correctCount(session);
  const errors = session.answers.length - correct;
  const total = session.answers.length;
  const perfect = errors === 0 && total >= TRAINING_LENGTH;
  const lastTwo = previous.slice(-2);

  const earned: Record<EncouragementId, boolean> = {
    'serie-parfaite': perfect,
    'nouveau-record': previous.length > 0 && previous.every((earlier) => averageTime(session) < averageTime(earlier)),
    eclair: perfect && averageTime(session) < LIGHTNING_MS_PER_QUESTION,
    'tu-t-ameliores':
      lastTwo.length === 2 &&
      averageTime(lastTwo[0]!) > averageTime(lastTwo[1]!) &&
      averageTime(lastTwo[1]!) > averageTime(session),
    'serie-en-feu': lastTwo.length === 2 && lastTwo.every((earlier) => sameDay(earlier.finishedAt, session.finishedAt)),
    'premiere-serie': previous.length === 0,
    'objectif-atteint': correct >= 0.8 * total,
    'pas-lache': errors >= 3,
    continue: correct >= 0.6 * total,
    presque: correct < 0.6 * total,
  };

  return ENCOURAGEMENTS.map((item) => item.id).filter((id) => earned[id]);
}

/**
 * Replays every training of a child to find the badges already collected.
 * @param trainings The child's trainings, in any order.
 * @returns The identifiers of the badges obtained at least once.
 */
export function collectedBadges(trainings: readonly Session[]): Set<EncouragementId> {
  const ordered = [...trainings].sort((left, right) => left.finishedAt.localeCompare(right.finishedAt));
  const collected = new Set<EncouragementId>();
  ordered.forEach((session, index) =>
    earnedFor(session, ordered.slice(0, index))
      .filter((id) => encouragement(id).badge)
      .forEach((id) => collected.add(id)),
  );
  return collected;
}
