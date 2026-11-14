import type { SkillRow } from '../../../features/stats/operationStats';
import { formatDuration } from '../../../features/stats/stats';
import { ProgressBar } from '../../ui/ProgressBar';
import { BANDS, MasteryBadge } from './MasteryBadge';

interface SkillTableProps {
  title: string;
  subtitle: string;
  rows: readonly SkillRow[];
}

const percent = (value: number) => `${Math.round(value * 100)} %`;

/**
 * One line per skill: mastery gauge and band, accuracy, median answer and thinking times.
 * @param props Heading and rows.
 */
export function SkillTable({ title, subtitle, rows }: SkillTableProps) {
  return (
    <section className="flex flex-col gap-3 rounded-[18px] bg-white p-[18px]" aria-label={title}>
      <div className="flex flex-col gap-0.5">
        <h3 className="m-0 text-[17px] font-bold">{title}</h3>
        <p className="m-0 text-[13px] text-muted">{subtitle}</p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {rows.map(({ skill, mastery, medianThinkMs }) => (
          <li key={skill.id} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-[15px] font-bold">{skill.label}</span>
              <MasteryBadge band={mastery.band} />
            </div>
            <ProgressBar value={mastery.score} tone={BANDS[mastery.band].bar} label={`${skill.label} : maîtrise ${percent(mastery.score)}`} />
            <div className="flex flex-wrap gap-x-3 text-[13px] text-muted">
              {mastery.attempts === 0 ? (
                <span>Aucune réponse pour l’instant</span>
              ) : (
                <>
                  <span>{mastery.attempts} réponse{mastery.attempts > 1 ? 's' : ''}</span>
                  <span>Réussite {percent(mastery.accuracy)}</span>
                  {mastery.medianMs !== null && <span>Réponse {formatDuration(mastery.medianMs)}</span>}
                  {medianThinkMs !== null && <span>Réflexion {formatDuration(medianThinkMs)}</span>}
                  <span>Objectif {formatDuration(skill.targetMs)}</span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
