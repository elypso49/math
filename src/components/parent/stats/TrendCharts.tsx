import type { ReactNode } from 'react';
import { formatDay, formatDuration } from '../../../features/stats/stats';
import type { TrendPoint } from '../../../features/stats/operationStats';

const WIDTH = 320;
const HEIGHT = 140;
const PAD = { top: 12, right: 8, bottom: 22, left: 36 };

const x = (index: number, count: number) =>
  PAD.left + (count === 1 ? (WIDTH - PAD.left - PAD.right) / 2 : (index * (WIDTH - PAD.left - PAD.right)) / (count - 1));

const Card = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <figure className="m-0 flex flex-col gap-2 rounded-[18px] bg-white p-[18px]">
    <figcaption className="flex flex-col gap-0.5">
      <span className="text-[17px] font-bold">{title}</span>
      <span className="text-[13px] text-muted">{subtitle}</span>
    </figcaption>
    {children}
  </figure>
);

/**
 * Median answer time per session, with the target time as a dashed reference.
 * @param props Points of the trend and the target time.
 */
export function TimeTrend({ points, targetMs }: { points: readonly TrendPoint[]; targetMs: number }) {
  const top = Math.max(targetMs * 1.2, ...points.map((point) => point.medianMs));
  const y = (ms: number) => PAD.top + (1 - ms / top) * (HEIGHT - PAD.top - PAD.bottom);
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index, points.length)},${y(point.medianMs)}`).join(' ');
  const ticks = [0, top / 2, top];

  return (
    <Card title="Temps de réponse médian" subtitle={`Par série · objectif ${formatDuration(targetMs)} en pointillés`}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Évolution du temps de réponse médian par série">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-track)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" className="fill-muted text-[10px]">
              {formatDuration(tick)}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={y(targetMs)}
          y2={y(targetMs)}
          stroke="var(--color-success)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
        <path d={path} fill="none" stroke="var(--color-brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <g key={point.finishedAt}>
            <circle cx={x(index, points.length)} cy={y(point.medianMs)} r={10} fill="transparent">
              <title>{`${formatDay(point.finishedAt)} : ${formatDuration(point.medianMs)} (${point.answered} réponses)`}</title>
            </circle>
            <circle cx={x(index, points.length)} cy={y(point.medianMs)} r={4} fill="var(--color-brand)" stroke="white" strokeWidth={2} pointerEvents="none" />
          </g>
        ))}
        <text x={PAD.left} y={HEIGHT - 6} className="fill-muted text-[10px]">
          {points[0] && formatDay(points[0].finishedAt)}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" className="fill-muted text-[10px]">
          {points.at(-1) && formatDay(points.at(-1)!.finishedAt)}
        </text>
      </svg>
    </Card>
  );
}

/**
 * Share of right answers per session, one bar each.
 * @param props Points of the trend.
 */
export function AccuracyTrend({ points }: { points: readonly TrendPoint[] }) {
  const slot = (WIDTH - PAD.left - PAD.right) / Math.max(points.length, 1);
  const bar = Math.min(18, slot - 2);
  const y = (share: number) => PAD.top + (1 - share) * (HEIGHT - PAD.top - PAD.bottom);

  return (
    <Card title="Réussite par série" subtitle="Part de bonnes réponses, de la plus ancienne à la plus récente">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Réussite par série">
        {[0, 0.5, 1].map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-track)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" className="fill-muted text-[10px]">
              {tick * 100} %
            </text>
          </g>
        ))}
        {points.map((point, index) => {
          const left = PAD.left + index * slot + (slot - bar) / 2;
          return (
            <g key={point.finishedAt}>
              <rect x={PAD.left + index * slot} y={PAD.top} width={slot} height={HEIGHT - PAD.top - PAD.bottom} fill="transparent">
                <title>{`${formatDay(point.finishedAt)} : ${Math.round(point.accuracy * 100)} % sur ${point.answered} réponses`}</title>
              </rect>
              <rect
                x={left}
                y={y(point.accuracy)}
                width={bar}
                height={Math.max(2, y(0) - y(point.accuracy))}
                rx={4}
                fill="var(--color-brand)"
                pointerEvents="none"
              />
            </g>
          );
        })}
      </svg>
    </Card>
  );
}
