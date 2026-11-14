import type { OperationStats } from '../../../features/stats/operationStats';
import { formatDuration } from '../../../features/stats/stats';

const percent = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)} %`);
const duration = (value: number | null) => (value === null ? '—' : formatDuration(value));

const Tile = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="flex flex-col gap-0.5 rounded-[18px] bg-white p-4">
    <span className="text-[13px] text-muted">{label}</span>
    <span className="text-[22px] font-bold">{value}</span>
    {hint && <span className="text-[12px] text-muted">{hint}</span>}
  </div>
);

const deltaHint = (delta: number | null) => {
  if (delta === null)
    return 'Pas assez de recul';
  const points = Math.round(delta * 100);
  if (points === 0)
    return 'Stable sur 7 jours';
  return `${points > 0 ? '+' : '−'}${Math.abs(points)} pts sur 7 jours`;
};

/**
 * Six headline figures of an operation: volume, accuracy, and the three timings of each question.
 * @param props Statistics of the operation.
 */
export const KeyFigures = ({ stats }: { stats: OperationStats }) => (
  <div className="grid grid-cols-2 gap-3">
    <Tile label="Questions" value={String(stats.answered)} />
    <Tile label="Réussite" value={percent(stats.accuracy)} hint={deltaHint(stats.accuracyDelta)} />
    <Tile label="Temps de réponse" value={duration(stats.medianAnswerMs)} hint="Médiane, jusqu’à la validation" />
    <Tile label="Temps de réflexion" value={duration(stats.medianThinkMs)} hint="Médiane, jusqu’au premier chiffre" />
    <Tile label="Lecture de la correction" value={duration(stats.medianReviewMs)} hint="Médiane, avant la suite" />
    <Tile label="Hésitations" value={percent(stats.hesitationRate)} hint="Réponses corrigées avant validation" />
  </div>
);
