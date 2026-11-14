import { Keypad } from '../ui/Keypad';
import { ErrorText } from '../ui/Notice';
import { PinSlots } from '../ui/PinSlots';

interface PinPadProps {
  typed: string;
  rejected: boolean;
  busy?: boolean;
  dotTone?: string;
  onDigit: (digit: string) => void;
  onErase: () => void;
}

/**
 * Code slots and numeric pad; a rejected code shakes the whole pad under a red message.
 * @param props Typing state and handlers.
 */
export function PinPad({ typed, rejected, busy = false, dotTone, onDigit, onErase }: PinPadProps) {
  return (
    <div className={`flex flex-col gap-4 ${rejected ? 'shake' : ''}`}>
      <PinSlots typed={typed} tone={dotTone} />
      <ErrorText>{rejected ? 'Code incorrect' : null}</ErrorText>
      <Keypad onDigit={onDigit} onErase={onErase} disabled={busy} />
    </div>
  );
}
