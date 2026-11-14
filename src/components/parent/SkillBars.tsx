import { LEVEL_LABELS, OPERATION_NAMES, type LevelTone } from '../../features/stats/stats';
import { activeOperations } from '../../features/exercise/series';
import { MAX_LEVEL, type Levels, type Operation } from '../../types/math.types';
import { ProgressBar } from '../ui/ProgressBar';

const TEXT: Record<LevelTone, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  neutral: 'text-muted',
  success: 'text-success',
};

const BAR: Record<LevelTone, string> = {
  danger: 'bg-danger-bar',
  warning: 'bg-warning-bar',
  neutral: 'bg-brand',
  success: 'bg-brand',
};

/**
 * One gauge per operation the child practises, with its level and a word describing it.
 * @param props Levels of the child and the operations chosen by the parent.
 */
export function SkillBars({ levels, operations }: { levels: Levels; operations: readonly Operation[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] bg-white p-[18px]">
      {activeOperations(operations).map((operation) => {
        const level = levels[operation];
        const { label, tone } = LEVEL_LABELS[level];
        return (
          <div key={operation} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-[17px] font-bold">{OPERATION_NAMES[operation]}</span>
              <span className={`text-sm font-bold ${TEXT[tone]}`}>
                Niveau {level} / {MAX_LEVEL} · {label}
              </span>
            </div>
            <ProgressBar value={level / MAX_LEVEL} tone={BAR[tone]} label={`${OPERATION_NAMES[operation]} : niveau ${level}`} />
          </div>
        );
      })}
    </div>
  );
}
