interface PinSlotsProps {
  /** Digits typed so far. */
  typed: string;
  length?: number;
  /** Colour class of the dots. */
  tone?: string;
}

/**
 * Four boxes filling with a dot per digit typed, without revealing the code.
 * @param props Digits typed, expected length and dot colour.
 */
export function PinSlots({ typed, length = 4, tone = 'text-ink' }: PinSlotsProps) {
  return (
    <div
      aria-live="polite"
      aria-label={`${typed.length} chiffre${typed.length > 1 ? 's' : ''} sur ${length}`}
      className="flex justify-center gap-3"
    >
      {Array.from({ length }, (_, index) => (
        <div
          key={index}
          className={`flex h-16 w-14 items-center justify-center rounded-[14px] border-2 border-line bg-white text-[26px] ${tone}`}
        >
          {typed[index] ? '●' : ''}
        </div>
      ))}
    </div>
  );
}
