import type { GradeExpectation, GradeProgress } from '../../features/learning/grades';
import { OPERATION_NAMES } from '../../features/stats/stats';
import type { Operation } from '../../types/math.types';
import { ProgressBar } from '../ui/ProgressBar';

type Tone = 'danger' | 'warning' | 'neutral' | 'success';

const TEXT: Record<Tone, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  neutral: 'text-muted',
  success: 'text-success',
};

const BAR: Record<Tone, string> = {
  danger: 'bg-danger-bar',
  warning: 'bg-warning-bar',
  neutral: 'bg-brand',
  success: 'bg-brand',
};

const toneOf = (share: number): Tone => {
  if (share < 0.5)
    return 'danger';
  if (share < 0.8)
    return 'warning';
  return share < 1 ? 'neutral' : 'success';
};

/**
 * Writes how a child stands against a school year, for example « 72 % du niveau CE1 »
 * or « Au-delà du CE1 : niveau ≈ CM1 ».
 * @param grade School year of the child.
 * @param progress Where the child stands.
 * @returns The sentence.
 */
export function describeProgress(grade: GradeExpectation, progress: GradeProgress): string {
  if (progress.share === null)
    return `Pas encore au programme en ${grade.label}`;
  if (progress.beyond)
    return `Au-delà du ${grade.label} : niveau ≈ ${progress.beyond.label}${progress.beyond.id === '6e' ? ' ou plus' : ''}`;
  return `${Math.round(progress.share * 100)} % du niveau ${grade.label}`;
}

interface SkillBarsProps {
  grade: GradeExpectation;
  rows: readonly { operation: Operation; progress: GradeProgress }[];
}

/**
 * One gauge per operation the child practises, filled by the share of what
 * their school year expects.
 * @param props School year of the child and where they stand in each operation.
 */
export function SkillBars({ grade, rows }: SkillBarsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] bg-white p-[18px]">
      {rows.map(({ operation, progress }) => {
        const share = progress.share ?? 0;
        const tone = progress.share === null ? 'neutral' : toneOf(share);
        return (
          <div key={operation} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-[17px] font-bold">{OPERATION_NAMES[operation]}</span>
              <span className={`text-sm font-bold ${TEXT[tone]}`}>{describeProgress(grade, progress)}</span>
            </div>
            {progress.share !== null && (
              <ProgressBar value={share} tone={BAR[tone]} label={`${OPERATION_NAMES[operation]} : ${Math.round(share * 100)} % du niveau ${grade.label}`} />
            )}
            {progress.share !== null && progress.measured < progress.expected && (
              <span className="text-[13px] text-muted">
                {progress.measured} compétence{progress.measured > 1 ? 's' : ''} travaillée{progress.measured > 1 ? 's' : ''} sur {progress.expected} attendues
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
