interface ProgressBarProps {
  /** Filled share, from 0 to 1. */
  value: number;
  /** Colour class of the filled part. */
  tone?: string;
  label?: string;
}

/**
 * Rounded horizontal gauge.
 * @param props Filled share, colour and accessible label.
 */
export function ProgressBar({ value, tone = 'bg-brand', label }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className="h-2.5 overflow-hidden rounded-md bg-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className={`h-full ${tone} transition-[width] duration-300`} style={{ width: `${percent}%` }} />
    </div>
  );
}
