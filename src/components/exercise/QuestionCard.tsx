import { formatQuestion, resultOf, SYMBOLS, type Question } from '../../features/exercise/questions';

interface QuestionCardProps {
  question: Question;
  /** Digits typed so far. */
  typed: string;
}

const AnswerBox = ({ typed, small = false }: { typed: string; small?: boolean }) => (
  <div
    aria-live="polite"
    aria-label={typed ? `Ta réponse : ${typed}` : 'Réponse vide'}
    className={`flex items-center justify-center rounded-[18px] border-[3px] border-brand font-bold ${small ? 'min-h-16 min-w-24 px-3 text-[38px]' : 'min-h-[76px] min-w-40 px-5 text-[44px]'}`}
  >
    {typed || '?'}
  </div>
);

/**
 * White card holding the calculation and the answer box, the box standing in for
 * the hidden operand of a calculation with a blank.
 * @param props Question and typed answer.
 */
export function QuestionCard({ question, typed }: QuestionCardProps) {
  if (question.blank) {
    const box = <AnswerBox typed={typed} small />;
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-4 py-7">
        <div className="text-base text-muted">Trouve le nombre manquant</div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[40px] font-bold">
          {question.blank === 'left' ? box : <span>{question.left}</span>}
          <span>{SYMBOLS[question.operation]}</span>
          {question.blank === 'right' ? box : <span>{question.right}</span>}
          <span>= {resultOf(question)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-4 py-7">
      <div className="text-base text-muted">Combien font</div>
      <div className="text-[46px] font-bold tracking-wide">{formatQuestion(question)} =</div>
      <AnswerBox typed={typed} />
    </div>
  );
}
