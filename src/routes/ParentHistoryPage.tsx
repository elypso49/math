import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { SessionHistoryCard } from '../components/parent/history/SessionHistoryCard';
import { ParentNav } from '../components/parent/ParentNav';
import { BackLink } from '../components/ui/BackLink';
import { Notice } from '../components/ui/Notice';
import { Screen } from '../components/ui/Screen';
import { useChild, useChildSessions } from '../features/family/family.context';

/** Every training and evaluation of a child, latest first, each unfolding into its answers. */
export function ParentHistoryPage() {
  const { childId = null } = useParams();
  const child = useChild(childId);
  const sessions = useChildSessions(childId);
  const latestFirst = useMemo(() => [...sessions].sort((left, right) => right.finishedAt.localeCompare(left.finishedAt)), [sessions]);

  if (!child)
    return <Navigate to="/parent" replace />;

  return (
    <Screen gap="tight">
      <ParentNav current="stats" />
      <BackLink to={`/parent?child=${child.id}`} label="Retour aux statistiques" />
      <h2 className="m-0 text-[22px] font-bold">Séries et évaluations de {child.name}</h2>
      {latestFirst.length === 0 && <Notice>Aucune série terminée pour l’instant.</Notice>}
      {latestFirst.map((session) => (
        <SessionHistoryCard key={session.id} session={session} />
      ))}
    </Screen>
  );
}
