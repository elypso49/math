import { OPERATION_NAMES } from '../../../features/stats/stats';
import { OPERATIONS, type Operation } from '../../../types/math.types';
import { Icon, type IconName } from '../../ui/Icon';

/** A tab of the statistics screen: the overview or one operation. */
export type StatTab = 'overview' | Operation;

const LABELS: Record<StatTab, string> = { overview: 'Vue d’ensemble', ...OPERATION_NAMES };

const ICONS: Record<StatTab, IconName> = {
  overview: 'ui/stats-overview',
  add: 'ui/op-add',
  sub: 'ui/op-sub',
  mul: 'ui/op-mul',
  div: 'ui/op-div',
};

interface StatTabsProps {
  active: StatTab;
  onSelect: (tab: StatTab) => void;
}

/**
 * Row of pictogram tabs switching between the overview and the detail of each operation.
 * @param props Active tab and selection handler.
 */
export function StatTabs({ active, onSelect }: StatTabsProps) {
  return (
    <div role="tablist" aria-label="Détail des statistiques" className="grid grid-cols-5 gap-2">
      {(['overview', ...OPERATIONS] as StatTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === active}
          aria-label={LABELS[tab]}
          title={LABELS[tab]}
          onClick={() => onSelect(tab)}
          className={`flex h-14 items-center justify-center rounded-2xl ${tab === active ? 'bg-ink text-white' : 'bg-key text-ink'}`}
        >
          <Icon name={ICONS[tab]} size={30} />
        </button>
      ))}
    </div>
  );
}
