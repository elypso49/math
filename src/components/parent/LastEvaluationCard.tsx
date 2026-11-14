import { formatDay, formatDuration } from '../../features/stats/stats';
import { MAX_LEVEL, type Level } from '../../types/math.types';

interface LastEvaluationCardProps {
  finishedAt: string;
  total: number;
  correct: number;
  averageMs: number;
  overall: Level;
}

/**
 * Date, score, mean time and overall level of the latest evaluation.
 * @param props Figures of the evaluation and the current overall level.
 */
export const LastEvaluationCard = ({ finishedAt, total, correct, averageMs, overall }: LastEvaluationCardProps) => (
  <div className="flex flex-col gap-2 rounded-[18px] bg-white p-[18px]">
    <div className="text-[17px] font-bold">Dernière évaluation</div>
    <div className="text-[15px] text-muted">
      {formatDay(finishedAt)} · {total} questions · {correct} bonne{correct > 1 ? 's' : ''} réponse{correct > 1 ? 's' : ''}
    </div>
    <div className="mt-1.5 flex gap-3">
      <Figure label="Temps moyen" value={formatDuration(averageMs)} />
      <Figure label="Niveau global" value={`${overall} / ${MAX_LEVEL}`} />
    </div>
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
