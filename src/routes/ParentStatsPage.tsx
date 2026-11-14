import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChildChips } from '../components/parent/ChildChips';
import { ParentNav } from '../components/parent/ParentNav';
import { OperationStatsView } from '../components/parent/stats/OperationStatsView';
import { OverviewPanel } from '../components/parent/stats/OverviewPanel';
import { StatTabs } from '../components/parent/stats/StatTabs';
import { Notice } from '../components/ui/Notice';
import { Screen } from '../components/ui/Screen';
import { useParentStats } from '../features/stats/useParentStats';

/** Parent dashboard: overview of a child, then the detailed statistics of each operation. */
export function ParentStatsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const stats = useParentStats(params.get('child'));
  const { child, detail } = stats;

  return (
    <Screen gap="tight">
      <ParentNav current="stats" />

      <ChildChips
        profiles={stats.children}
        selectedId={child?.id ?? null}
        onSelect={stats.select}
        onAdd={() => navigate('/parent/config?add=1')}
      />

      {!child && <Notice>Ajoute un premier enfant pour suivre ses progrès.</Notice>}

      {child && (
        <>
          <StatTabs active={stats.tab} onSelect={stats.setTab} />
          {detail ? (
            <OperationStatsView operation={detail.operation} stats={detail.stats} targetMs={detail.targetMs} />
          ) : (
            <OverviewPanel child={child} overall={stats.overall} evaluation={stats.evaluation} insights={stats.insights} week={stats.week} />
          )}
        </>
      )}
    </Screen>
  );
}
