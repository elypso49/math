import type { GradeExpectation, GradeProgress } from '../../../features/learning/grades';
import type { Insight, WeekSummary } from '../../../features/stats/stats';
import type { Child, Operation, Session } from '../../../types/math.types';
import { LinkButton } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Notice } from '../../ui/Notice';
import { LastEvaluationCard, NoEvaluationCard } from '../LastEvaluationCard';
import { describeProgress, SkillBars } from '../SkillBars';
import { WeekStats } from '../WeekStats';

interface OverviewPanelProps {
  child: Child;
  progress: {
    grade: GradeExpectation;
    overall: GradeProgress;
    byOperation: { operation: Operation; progress: GradeProgress }[];
  } | null;
  evaluation: { session: Session; total: number; correct: number; averageMs: number } | null;
  insights: readonly Insight[];
  week: WeekSummary;
}

const SectionTitle = ({ icon, children }: { icon: 'target' | 'calendar'; children: string }) => (
  <h2 className="m-0 mt-1 flex items-center gap-2 text-[19px] font-bold">
    <Icon name={icon} size={20} />
    {children}
  </h2>
);

/**
 * Overview of a child: share of what their school year expects, latest evaluation,
 * what the algorithm adjusted, and the week.
 * @param props The child and its summarised figures.
 */
export function OverviewPanel({ child, progress, evaluation, insights, week }: OverviewPanelProps) {
  return (
    <>
      <SectionTitle icon="target">{`Ce que sait faire ${child.name}`}</SectionTitle>
      {progress ? (
        <SkillBars grade={progress.grade} rows={progress.byOperation} />
      ) : (
        <Notice>{`Indique la classe de ${child.name} dans les réglages pour comparer ses calculs au niveau attendu.`}</Notice>
      )}

      {evaluation ? (
        <LastEvaluationCard
          finishedAt={evaluation.session.finishedAt}
          total={evaluation.total}
          correct={evaluation.correct}
          averageMs={evaluation.averageMs}
          expected={progress && describeProgress(progress.grade, progress.overall)}
        />
      ) : (
        <NoEvaluationCard />
      )}
      <LinkButton to={`/parent/history/${child.id}`} variant="secondary">
        <Icon name="eye" size={20} />
        Voir toutes les séries et évaluations
      </LinkButton>

      {insights.map((insight) => (
        <Notice key={insight.message} icon={insight.progress ? 'trending-up' : 'triangle-alert'}>
          {insight.message}
        </Notice>
      ))}

      <SectionTitle icon="calendar">Cette semaine</SectionTitle>
      <WeekStats week={week} />
    </>
  );
}
