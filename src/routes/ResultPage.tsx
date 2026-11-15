import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AnswerList } from '../components/result/AnswerList';
import { EarnedBadges, EncouragementBanner } from '../components/result/EncouragementBanner';
import { ScoreCard, TimeCard } from '../components/result/ScoreCard';
import { LinkButton } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Screen, Spacer } from '../components/ui/Screen';
import { earnedFor, encouragement } from '../features/encouragement/encouragements';
import { useChildSessions } from '../features/family/family.context';
import { figures, formatDuration } from '../features/stats/stats';
import type { Child } from '../types/math.types';

/**
 * Summary of a finished session: score, encouragement, time and every answer.
 * @param props The open child.
 */
export function ResultPage({ child }: { child: Child }) {
  const { id } = useParams();
  const sessions = useChildSessions(child.id);
  const index = sessions.findIndex((session) => session.id === id);
  const session = sessions[index];

  const earned = useMemo(() => {
    if (!session || session.kind === 'evaluation')
      return [];
    const previous = sessions.slice(0, index).filter((earlier) => earlier.kind !== 'evaluation');
    return earnedFor(session, previous).map(encouragement);
  }, [session, sessions, index]);

  if (!session)
    return <Navigate to="/home" replace />;

  const { correct, total } = figures(session);
  const evaluation = session.kind === 'evaluation';
  const [main, ...others] = earned;

  return (
    <Screen gap="tight">
      <h1 className="m-0 text-[28px] font-bold">{evaluation ? 'Bilan de l’évaluation' : 'Bilan de la série'}</h1>
      <ScoreCard correct={correct} total={total} />

      {main && <EncouragementBanner encouragement={main} />}
      <EarnedBadges badges={others.filter((badge) => badge.badge)} />

      {evaluation && <p className="m-0 text-[15px] text-muted">Tes prochains entraînements s’adaptent à ce que tu sais faire.</p>}

      <TimeCard label="Temps total" value={formatDuration(session.durationMs)} />
      <AnswerList answers={session.answers} />

      <Spacer />
      <LinkButton to={`/${session.kind}?questions=${total}`}>
        Recommencer une série
        <Icon name="rotate-ccw" size={20} />
      </LinkButton>
      <LinkButton to="/home" variant="secondary">
        Retour à l’accueil
        <Icon name="house" size={18} />
      </LinkButton>
    </Screen>
  );
}
