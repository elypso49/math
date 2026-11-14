import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../ui/Icon';

/** Screen of the parent area currently shown. */
export type ParentScreen = 'stats' | 'config';

const LINKS: { screen: ParentScreen; to: string; label: string; icon: IconName }[] = [
  { screen: 'stats', to: '/parent', label: 'Statistiques', icon: 'chart-column' },
  { screen: 'config', to: '/parent/config', label: 'Configuration', icon: 'user' },
];

/**
 * Header of the parent area: the way back to the profile picker on the right, then the
 * buttons switching between its two screens.
 * @param props The screen currently shown.
 */
export function ParentNav({ current }: { current: ParentScreen }) {
  return (
    <>
      <div className="flex items-center justify-end">
        <h1 className="sr-only">{LINKS.find((link) => link.screen === current)!.label}</h1>
        <Link
          to="/"
          aria-label="Retour à l’accueil et verrouiller"
          title="Retour à l’accueil et verrouiller"
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-ink text-white no-underline"
        >
          <Icon name="house" size={24} />
        </Link>
      </div>
      <nav aria-label="Espace parent" className="grid grid-cols-2 gap-2.5">
        {LINKS.map((link) => {
          const active = link.screen === current;
          return (
            <Link
              key={link.screen}
              to={link.to}
              aria-current={active ? 'page' : undefined}
              className={`flex h-[52px] items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold no-underline ${active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'}`}
            >
              <Icon name={link.icon} size={20} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
