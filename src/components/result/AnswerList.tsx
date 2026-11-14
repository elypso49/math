import { useState } from 'react';
import { formatQuestion, formatWith } from '../../features/exercise/questions';
import { formatDuration } from '../../features/stats/stats';
import type { Answer } from '../../types/math.types';
import { Icon } from '../ui/Icon';

const AnswerRow = ({ answer, position }: { answer: Answer; position: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-ink ${answer.correct ? 'bg-white' : 'bg-danger-soft'}`}
      >
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-lg font-bold">
            {position}. {formatQuestion(answer)}
          </span>
          {!answer.correct && <span className="text-[15px] text-danger">Bon résultat : {answer.expected}</span>}
          {open && (
            <span className="text-[15px] text-muted">
              {formatWith(answer, answer.expected)} · {answer.skipped ? 'passé' : 'répondu'} en {formatDuration(answer.durationMs)}
              {answer.thinkMs !== undefined && ` · premier chiffre après ${formatDuration(answer.thinkMs)}`}
            </span>
          )}
        </span>
        <span className={answer.skipped ? 'text-[15px] font-bold text-danger' : 'text-lg'}>
          {answer.skipped ? 'Trop dur' : answer.given}
        </span>
        <Icon
          name={answer.correct ? 'circle-check' : 'circle-x'}
          size={22}
          className={answer.correct ? 'text-success' : 'text-danger'}
          label={answer.correct ? 'Bonne réponse' : 'Mauvaise réponse'}
        />
      </button>
    </li>
  );
};

/**
 * Every answer of the session; touching one reveals the correction and the time taken.
 * @param props Answers in the order they were given.
 */
export function AnswerList({ answers }: { answers: readonly Answer[] }) {
  return (
    <>
      <h2 className="m-0 mt-1 text-xl font-bold">Tes réponses</h2>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {answers.map((answer, index) => (
          <AnswerRow key={index} answer={answer} position={index + 1} />
        ))}
      </ul>
      <div className="text-sm text-muted">Touche une réponse pour voir le détail de la correction.</div>
    </>
  );
}
