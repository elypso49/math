import type { Encouragement } from '../../features/encouragement/encouragements';
import { EncouragementIcon } from '../encouragement/EncouragementIcon';

/**
 * Green banner carrying the main encouragement of the series.
 * @param props The encouragement to show.
 */
export const EncouragementBanner = ({ encouragement }: { encouragement: Encouragement }) => (
  <div className="flex items-center gap-3.5 rounded-[20px] bg-brand-soft px-5 py-[18px] text-success">
    <EncouragementIcon id={encouragement.id} size={40} />
    <div className="flex flex-col gap-0.5">
      <div className="text-xl font-bold">{encouragement.title}</div>
      <div className="text-base">{encouragement.detail}</div>
    </div>
  </div>
);

/**
 * Row of the other badges earned during the series.
 * @param props Badges besides the main one.
 */
export function EarnedBadges({ badges }: { badges: readonly Encouragement[] }) {
  if (badges.length === 0)
    return null;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Autres badges gagnés">
      {badges.map((badge) => (
        <li key={badge.id} className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-3.5 pl-2 text-[15px] font-bold">
          <EncouragementIcon id={badge.id} size={24} />
          {badge.title}
        </li>
      ))}
    </ul>
  );
}
