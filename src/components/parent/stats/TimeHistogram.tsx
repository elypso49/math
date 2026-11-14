import type { TimeBucket } from '../../../features/stats/operationStats';

/**
 * How long answers take, by time range, right and wrong answers stacked.
 * @param props Answer counts per range.
 */
export function TimeHistogram({ buckets }: { buckets: readonly TimeBucket[] }) {
  const highest = Math.max(1, ...buckets.map((bucket) => bucket.correct + bucket.wrong));
  return (
    <section className="flex flex-col gap-3 rounded-[18px] bg-white p-[18px]" aria-label="Répartition des temps de réponse">
      <div className="flex flex-col gap-0.5">
        <h3 className="m-0 text-[17px] font-bold">Répartition des temps de réponse</h3>
        <p className="m-0 text-[13px] text-muted">Nombre de réponses par durée</p>
      </div>
      <div className="flex h-[120px] items-end gap-2">
        {buckets.map((bucket) => {
          const total = bucket.correct + bucket.wrong;
          return (
            <div
              key={bucket.label}
              className="flex h-full flex-1 flex-col justify-end gap-[2px]"
              title={`${bucket.label} : ${bucket.correct} juste${bucket.correct > 1 ? 's' : ''}, ${bucket.wrong} fausse${bucket.wrong > 1 ? 's' : ''}`}
              role="img"
              aria-label={`${bucket.label} : ${bucket.correct} justes, ${bucket.wrong} fausses`}
            >
              {bucket.wrong > 0 && <div className="rounded-t-[4px] bg-danger-bar" style={{ height: `${(bucket.wrong / highest) * 100}%` }} />}
              {bucket.correct > 0 && (
                <div
                  className={`bg-brand ${bucket.wrong > 0 ? '' : 'rounded-t-[4px]'}`}
                  style={{ height: `${(bucket.correct / highest) * 100}%` }}
                />
              )}
              {total === 0 && <div className="h-[2px] bg-track" />}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 text-[11px] text-muted" aria-hidden="true">
        {buckets.map((bucket) => (
          <span key={bucket.label} className="flex-1 text-center leading-tight">
            {bucket.label}
          </span>
        ))}
      </div>
      <div className="flex gap-4 text-[13px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-brand" />
          Justes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-danger-bar" />
          Fausses
        </span>
      </div>
    </section>
  );
}
