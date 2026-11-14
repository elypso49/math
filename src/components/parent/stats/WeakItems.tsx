import type { WeakItem } from '../../../features/stats/operationStats';
import { formatDuration } from '../../../features/stats/stats';
import { Icon } from '../../ui/Icon';

/**
 * The facts or categories that resist most, the ones the series bring back more often.
 * @param props Weakest items, weakest first.
 */
export function WeakItems({ items }: { items: readonly WeakItem[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-[18px] bg-white p-[18px]" aria-label="À retravailler">
      <div className="flex flex-col gap-0.5">
        <h3 className="m-0 flex items-center gap-2 text-[17px] font-bold">
          <Icon name="triangle-alert" size={18} />À retravailler
        </h3>
        <p className="m-0 text-[13px] text-muted">Ces calculs reviennent plus souvent dans les séries</p>
      </div>
      {items.length === 0 ? (
        <p className="m-0 text-[15px] text-muted">Rien de fragile pour l’instant.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {items.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3 border-t border-track py-2 first:border-t-0">
              <span className="text-[16px] font-bold">{item.label}</span>
              <span className="text-[13px] text-muted">
                {item.errors} erreur{item.errors > 1 ? 's' : ''} sur {item.attempts}
                {item.medianMs !== null && ` · ${formatDuration(item.medianMs)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
