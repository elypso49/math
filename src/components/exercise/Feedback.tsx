import { Icon } from '../ui/Icon';

interface FeedbackProps {
  correct: boolean;
  given: number;
  expected: number;
}

/**
 * Green or red verdict shown right after an answer is validated.
 * @param props Whether the answer is right, what was typed and the right result.
 */
export function Feedback({ correct, given, expected }: FeedbackProps) {
  return (
    <div
      role="status"
      className={`flex flex-col gap-1.5 rounded-[18px] px-5 py-[18px] ${correct ? 'bg-brand-soft text-success' : 'bg-danger-soft text-danger'}`}
    >
      <div className="flex items-center gap-2 text-[22px] font-bold">
        <Icon name={correct ? 'circle-check' : 'circle-x'} size={24} />
        {correct ? 'Bravo, c’est juste !' : 'Pas tout à fait.'}
      </div>
      <div className="text-[17px]">Ta réponse : {given}</div>
      {!correct && <div className="text-[17px] font-bold">Le bon résultat est {expected}.</div>}
    </div>
  );
}
