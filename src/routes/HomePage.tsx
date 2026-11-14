import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeShelf } from '../components/home/BadgeShelf';
import { ExerciseCard } from '../components/home/ExerciseCard';
import { TrainingLengthDialog } from '../components/home/TrainingLengthDialog';
import { Icon } from '../components/ui/Icon';
import { Screen } from '../components/ui/Screen';
import { useAccess } from '../features/access/access.context';
import { collectedBadges, ENCOURAGEMENTS } from '../features/encouragement/encouragements';
import { describeOperations, trainingSubtitle } from '../features/exercise/operations';
import { activeOperations, EVALUATION_LENGTH } from '../features/exercise/series';
import { useChildSessions } from '../features/family/family.context';
import type { Child } from '../types/math.types';

const BADGES = ENCOURAGEMENTS.filter((encouragement) => encouragement.badge);

/**
 * Child's home: the two exercises and the badges collected so far.
 * @param props The open child.
 */
export function HomePage({ child }: { child: Child }) {
  const navigate = useNavigate();
  const { leaveChild } = useAccess();
  const sessions = useChildSessions(child.id);
  const collected = useMemo(() => collectedBadges(sessions.filter((session) => session.kind !== 'evaluation')), [sessions]);
  const evaluated = sessions.some((session) => session.kind === 'evaluation');
  const [choosingFor, setChoosingFor] = useState<string | null>(null);

  const signOut = () => {
    leaveChild();
    navigate('/');
  };

  return (
    <Screen gap="loose">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[30px] font-bold">{child.name}</h1>
        <button
          type="button"
          onClick={signOut}
          aria-label="Se déconnecter"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-key text-ink"
        >
          <Icon name="log-out" size={22} />
        </button>
      </div>

      <div className="flex flex-col gap-3.5">
        <ExerciseCard
          to="/evaluation"
          icon="ui/evaluation"
          title="Faire une évaluation"
          subtitle={`${EVALUATION_LENGTH} questions · ${describeOperations(child.operations)} · niveaux mélangés`}
          action="Commencer l’évaluation"
          highlighted={!evaluated}
        />
        <ExerciseCard
          onClick={() => setChoosingFor('/training')}
          icon="ui/entrainement"
          title="Entraînement aux calculs"
          subtitle={trainingSubtitle(child.operations)}
          action="Commencer la série"
          highlighted={evaluated}
        />
        <ExerciseCard
          onClick={() => setChoosingFor('/blanks')}
          icon="ui/blanks"
          title="Calculs à trous"
          subtitle={trainingSubtitle(child.operations)}
          action="Trouver les nombres manquants"
        />
        {activeOperations(child.operations).includes('mul') && (
          <ExerciseCard
            onClick={() => setChoosingFor('/tables')}
            icon="ui/op-mul"
            title="Revoir mes tables de multiplications"
            subtitle="10 à 25 questions · tables de 1 à 10"
            action="Revoir mes tables"
          />
        )}
      </div>

      <BadgeShelf badges={BADGES} collected={collected} />

      <TrainingLengthDialog
        open={choosingFor !== null}
        onPick={(length) => navigate(`${choosingFor}?questions=${length}`)}
        onClose={() => setChoosingFor(null)}
      />
    </Screen>
  );
}
