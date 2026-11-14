import type { WeekSummary } from '../../features/stats/stats';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const Tile = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-1 flex-col gap-1 rounded-[18px] bg-white p-4">
    <div className="text-sm text-muted">{label}</div>
    <div className="text-[26px] font-bold">{value}</div>
  </div>
);

/**
 * Trainings and success rate of the week, then one bar per day.
 * @param props Summary of the current week.
 */
export function WeekStats({ week }: { week: WeekSummary }) {
  const highest = Math.max(1, ...week.perDay);
  const average = week.trainings / 7;
  return (
    <>
      <div className="flex gap-3">
        <Tile label="Séries" value={String(week.trainings)} />
        <Tile label="Réussite" value={week.successRate === null ? '—' : `${Math.round(week.successRate * 100)} %`} />
      </div>
      <div className="flex flex-col gap-3 rounded-[18px] bg-white p-[18px]">
        <div className="text-[17px] font-bold">Séries par jour</div>
        <div className="flex h-[120px] items-end justify-between gap-2">
          {week.perDay.map((count, index) => (
            <div
              key={index}
              role="img"
              aria-label={`${DAY_NAMES[index]} : ${count} série${count > 1 ? 's' : ''}`}
              className={`flex-1 rounded-t-md ${count >= average ? 'bg-brand' : 'bg-brand-light'}`}
              style={{ height: `${(count / highest) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-sm text-muted" aria-hidden="true">
          {DAYS.map((day, index) => (
            <span key={index} className="flex-1 text-center">
              {day}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
