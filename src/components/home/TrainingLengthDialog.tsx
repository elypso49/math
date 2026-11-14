import { TRAINING_LENGTH, TRAINING_LENGTHS } from '../../features/exercise/series';
import { Dialog } from '../ui/Dialog';

interface TrainingLengthDialogProps {
  open: boolean;
  onPick: (length: number) => void;
  onClose: () => void;
}

/**
 * Asks how many questions the training series holds; the usual length stands out.
 * @param props Open state, choice and close handlers.
 */
export function TrainingLengthDialog({ open, onPick, onClose }: TrainingLengthDialogProps) {
  return (
    <Dialog open={open} title="Combien de questions ?" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {TRAINING_LENGTHS.map((length) => (
          <button
            key={length}
            type="button"
            onClick={() => onPick(length)}
            className={`flex h-[72px] items-center justify-center rounded-[18px] border-2 text-[30px] font-bold ${length === TRAINING_LENGTH ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'}`}
          >
            {length}
          </button>
        ))}
      </div>
    </Dialog>
  );
}
