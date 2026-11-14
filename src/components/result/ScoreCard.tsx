import { Icon } from '../ui/Icon';

interface ScoreCardProps {
  correct: number;
  total: number;
}

/**
 * Big score of the session.
 * @param props Right answers and number of questions.
 */
export const ScoreCard = ({ correct, total }: ScoreCardProps) => (
  <div className="flex flex-col items-center gap-1.5 rounded-3xl bg-white px-4 py-[26px]">
    <div className="flex items-center gap-2 text-base text-muted">
      <Icon name="trophy" size={18} />
      Bonnes réponses
    </div>
    <div className="text-[56px] font-bold text-success">
      {correct} / {total}
    </div>
  </div>
);

interface TimeCardProps {
  label: string;
  value: string;
}

/**
 * Small white tile with a label and a figure.
 * @param props Label and formatted value.
 */
export const TimeCard = ({ label, value }: TimeCardProps) => (
  <div className="flex flex-col gap-1 rounded-[18px] bg-white p-4">
    <div className="flex items-center gap-1.5 text-sm text-muted">
      <Icon name="timer" size={16} />
      {label}
    </div>
    <div className="text-[22px] font-bold">{value}</div>
  </div>
);
