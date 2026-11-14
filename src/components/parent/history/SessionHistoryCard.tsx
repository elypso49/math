import { useState } from 'react';
import { formatQuestion, formatWith } from '../../../features/exercise/questions';
import { figures, formatDuration } from '../../../features/stats/stats';
import type { Answer, Session, SessionKind } from '../../../types/math.types';
import { Icon, type IconName } from '../../ui/Icon';

const KINDS: Record<SessionKind, { label: string; icon: IconName }> = {
  training: { label: 'Entraînement', icon: 'ui/entrainement' },
  evaluation: { label: 'Évaluation', icon: 'ui/evaluation' },
  tables: { label: 'Révision des tables', icon: 'ui/op-mul' },
  blanks: { label: 'Calculs à trous', icon: 'ui/blanks' },
};

const formatMoment = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

const AnswerLine = ({ answer, position }: { answer: Answer; position: number }) => (
  <li className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${answer.correct ? 'bg-sand' : 'bg-danger-soft'}`}>
    <span className="w-6 shrink-0 text-sm text-muted">{position}.</span>
    <span className="flex flex-1 flex-col">
      <span className="text-[17px] font-bold">
        {answer.skipped ? formatQuestion(answer) : formatWith(answer, answer.given)}
      </span>
      {!answer.correct && <span className="text-sm text-danger">{answer.skipped ? 'Passée, trop dur' : 'Faux'} · bon résultat {answer.expected}</span>}
    </span>
    <span className="shrink-0 text-sm text-muted">{formatDuration(answer.durationMs)}</span>
    <Icon
      name={answer.correct ? 'circle-check' : 'circle-x'}
      size={20}
      className={answer.correct ? 'text-success' : 'text-danger'}
      label={answer.correct ? 'Bonne réponse' : 'Mauvaise réponse'}
    />
  </li>
);

/**
 * One finished training or evaluation: its summary, unfolding into every answer with its time and verdict.
 * @param props The session.
 */
export function SessionHistoryCard({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const { total, correct } = figures(session);

  return (
    <article className="flex flex-col gap-3 rounded-[18px] bg-white p-4">
      <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex items-center gap-3 text-left text-ink">
        <Icon name={KINDS[session.kind].icon} size={28} />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-bold">{KINDS[session.kind].label}</span>
          <span className="text-sm text-muted first-letter:uppercase">{formatMoment(session.finishedAt)}</span>
        </span>
        <span className="flex flex-col items-end gap-0.5">
          <span className="text-[17px] font-bold">
            {correct} / {total}
          </span>
          <span className="text-sm text-muted">{formatDuration(session.durationMs)}</span>
        </span>
        <Icon name="arrow-right" size={18} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
          {session.answers.map((answer, index) => (
            <AnswerLine key={index} answer={answer} position={index + 1} />
          ))}
        </ol>
      )}
    </article>
  );
}
