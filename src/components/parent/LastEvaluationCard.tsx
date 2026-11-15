import { formatDay, formatDuration } from '../../features/stats/stats';

interface LastEvaluationCardProps {
  finishedAt: string;
  total: number;
  correct: number;
  averageMs: number;
  /** Where the child stands against their school year, or null when it is not set. */
  expected: string | null;
}

/**
 * Date, score and mean time of the latest evaluation, with where the child stands
 * against their school year.
 * @param props Figures of the evaluation and the current standing.
 */
export const LastEvaluationCard = ({ finishedAt, total, correct, averageMs, expected }: LastEvaluationCardProps) => (
  <div className="flex flex-col gap-2 rounded-[18px] bg-white p-[18px]">
    <div className="text-[17px] font-bold">Dernière évaluation</div>
    <div className="text-[15px] text-muted">
      {formatDay(finishedAt)} · {total} questions · {correct} bonne{correct > 1 ? 's' : ''} réponse{correct > 1 ? 's' : ''}
    </div>
    <div className="mt-1.5 flex gap-3">
      <Figure label="Temps moyen" value={formatDuration(averageMs)} />
    </div>
    {expected && <div className="text-[15px] font-bold">{expected}</div>}
  </div>
);

const Figure = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-1 flex-col gap-0.5">
    <span className="text-[13px] text-muted">{label}</span>
    <span className="text-xl font-bold">{value}</span>
  </div>
);

/** Placeholder shown before the first evaluation. */
export const NoEvaluationCard = () => (
  <div className="flex flex-col gap-2 rounded-[18px] bg-white p-[18px]">
    <div className="text-[17px] font-bold">Dernière évaluation</div>
    <div className="text-[15px] text-muted">Pas encore d’évaluation. Elle se lance depuis l’accueil de l’enfant.</div>
  </div>
);
