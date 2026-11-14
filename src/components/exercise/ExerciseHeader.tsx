import { Icon } from '../ui/Icon';
import { ProgressBar } from '../ui/ProgressBar';

interface ExerciseHeaderProps {
  label: string;
  position: number;
  total: number;
  onQuit: () => void;
}

/**
 * Question counter, progress gauge and the button leaving the series.
 * @param props Wording prefix, current position, length and quit handler.
 */
export function ExerciseHeader({ label, position, total, onQuit }: ExerciseHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex grow flex-col gap-2">
        <div className="text-[15px] font-bold text-muted">
          {label} {position} sur {total}
        </div>
        <ProgressBar value={position / total} label="Avancement de la série" />
      </div>
      <button
        type="button"
        onClick={onQuit}
        aria-label="Quitter la série"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-key text-ink"
      >
        <Icon name="x" size={22} />
      </button>
    </div>
  );
}
