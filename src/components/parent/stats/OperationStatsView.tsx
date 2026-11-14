import type { OperationStats } from '../../../features/stats/operationStats';
import type { Operation } from '../../../types/math.types';
import { Notice } from '../../ui/Notice';
import { FactGrid } from './FactGrid';
import { KeyFigures } from './KeyFigures';
import { SkillTable } from './SkillTable';
import { TimeHistogram } from './TimeHistogram';
import { AccuracyTrend, TimeTrend } from './TrendCharts';
import { WeakItems } from './WeakItems';

const SKILL_TITLES: Record<Operation, { title: string; subtitle: string }> = {
  add: { title: 'Maîtrise par complexité', subtitle: 'Du plus simple au plus difficile' },
  sub: { title: 'Maîtrise par complexité', subtitle: 'Du plus simple au plus difficile' },
  mul: { title: 'Maîtrise des tables de 1 à 12', subtitle: 'Un fait compte pour ses deux tables · puis les grands nombres' },
  div: { title: 'Maîtrise des divisions de 1 à 12', subtitle: 'Classées par diviseur · puis les grands nombres' },
};

interface OperationStatsViewProps {
  operation: Operation;
  stats: OperationStats;
  targetMs: number;
}

/**
 * Full statistics of one operation: key figures, trends, mastery by skill, facts grid,
 * answer times and the items to work on.
 * @param props Operation, its statistics and the reference answer time of its current level.
 */
export function OperationStatsView({ operation, stats, targetMs }: OperationStatsViewProps) {
  if (stats.answered === 0)
    return <Notice>Aucune réponse sur cette opération pour l’instant.</Notice>;

  return (
    <div className="flex flex-col gap-4">
      <KeyFigures stats={stats} />
      <TimeTrend points={stats.trend} targetMs={targetMs} />
      <AccuracyTrend points={stats.trend} />
      <SkillTable {...SKILL_TITLES[operation]} rows={stats.skills} />
      {stats.grid && (operation === 'mul' || operation === 'div') && <FactGrid operation={operation} cells={stats.grid} />}
      <WeakItems items={stats.weakest} />
      <TimeHistogram buckets={stats.buckets} />
    </div>
  );
}
