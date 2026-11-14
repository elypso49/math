import type { Encouragement, EncouragementId } from '../../features/encouragement/encouragements';
import { EncouragementIcon } from '../encouragement/EncouragementIcon';

interface BadgeShelfProps {
  badges: readonly Encouragement[];
  collected: ReadonlySet<EncouragementId>;
}

/**
 * Grid of every badge, coloured when obtained and greyed while still to win.
 * @param props All badges and those already obtained.
 */
export function BadgeShelf({ badges, collected }: BadgeShelfProps) {
  return (
    <section className="flex flex-col gap-3" aria-label="Tes badges">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-lg font-bold">Tes badges</h2>
        <span className="text-[15px] text-muted">
          {collected.size} / {badges.length}
        </span>
      </div>
      <ul className="m-0 grid list-none grid-cols-4 gap-2.5 p-0">
        {badges.map((badge) => {
          const obtained = collected.has(badge.id);
          return (
            <li
              key={badge.id}
              className="flex flex-col items-center gap-1 rounded-2xl bg-white px-1 py-2.5 text-center"
              title={badge.detail}
            >
              <EncouragementIcon id={badge.id} obtained={obtained} size={32} />
              <span className={`text-xs leading-tight ${obtained ? 'font-bold text-ink' : 'text-muted'}`}>
                {badge.title}
                <span className="sr-only">{obtained ? ', obtenu' : ', à gagner'}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
