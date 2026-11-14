import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExerciseHeader } from '../components/exercise/ExerciseHeader';
import { Feedback } from '../components/exercise/Feedback';
import { QuestionCard } from '../components/exercise/QuestionCard';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Dialog';
import { Icon } from '../components/ui/Icon';
import { Keypad } from '../components/ui/Keypad';
import { ErrorText } from '../components/ui/Notice';
import { Screen } from '../components/ui/Screen';
import { trainingLength } from '../features/exercise/series';
import { useExercise } from '../features/exercise/useExercise';
import type { Child, SessionKind } from '../types/math.types';

interface ExercisePageProps {
  kind: SessionKind;
  child: Child;
}

/**
 * One question at a time: the calculation, the pad, then the verdict.
 * @param props Kind of session and the child playing.
 */
export function ExercisePage({ kind, child }: ExercisePageProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const exercise = useExercise(kind, child, trainingLength(params.get('questions')));
  const [quitting, setQuitting] = useState(false);
  const last = exercise.position === exercise.total;

  const showResult = (sessionId: string | null) => {
    if (sessionId)
      navigate(`/result/${sessionId}`, { replace: true });
  };

  const next = async () => showResult(await exercise.next());

  const validate = () => void exercise.validate().then(showResult);

  useEffect(() => {
    if (exercise.phase !== 'checked' || quitting)
      return;
    const listen = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.repeat)
        void next();
    };
    window.addEventListener('keydown', listen);
    return () => window.removeEventListener('keydown', listen);
  });

  return (
    <Screen>
      <ExerciseHeader
        label={{ evaluation: 'Évaluation · question', tables: 'Tables · question', blanks: 'Calcul à trou', training: 'Question' }[kind]}
        position={exercise.position}
        total={exercise.total}
        onQuit={() => setQuitting(true)}
      />

      {exercise.question.reason === 'retry' && (
        <div className="self-center rounded-full bg-warning-soft px-4 py-1.5 text-[15px] font-bold text-warning">
          Deuxième chance sur un calcul raté
        </div>
      )}
      <QuestionCard question={exercise.question} typed={exercise.typed} />

      {exercise.lastAnswer && (
        <Feedback correct={exercise.lastAnswer.correct} given={exercise.lastAnswer.given} expected={exercise.lastAnswer.expected} />
      )}

      {exercise.phase === 'answering' ? (
        <div className="flex flex-col gap-3.5">
          <Keypad
            onDigit={exercise.press}
            onErase={exercise.erase}
            onEnter={validate}
            onSkip={kind === 'evaluation' ? () => void exercise.skip().then(showResult) : undefined}
            disabled={quitting}
          />
          <Button onClick={validate} disabled={exercise.typed === ''}>
            <Icon name="check" size={20} />
            Valider
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <ErrorText>{exercise.error}</ErrorText>
          <NextButton last={last} saving={exercise.phase === 'saving'} onNext={() => void next()} />
        </div>
      )}

      <ConfirmDialog
        open={quitting}
        title="Quitter la série ?"
        message="Les réponses déjà données ne seront pas gardées."
        confirmLabel="Quitter"
        danger
        onConfirm={() => navigate('/home')}
        onCancel={() => setQuitting(false)}
      />
    </Screen>
  );
}

const NextButton = ({ last, saving, onNext }: { last: boolean; saving: boolean; onNext: () => void }) => (
  <Button onClick={onNext} disabled={saving}>
    {saving ? 'Enregistrement…' : last ? 'Voir le bilan' : 'Question suivante'}
    <Icon name="arrow-right" size={20} />
  </Button>
);
