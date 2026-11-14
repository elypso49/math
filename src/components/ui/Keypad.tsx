import { useEffect } from 'react';
import { Icon } from './Icon';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onErase: () => void;
  /** Called when Enter is pressed on a physical keyboard. */
  onEnter?: () => void;
  /** Shows the red « C'est trop dur » key next to the erase key. */
  onSkip?: () => void;
  disabled?: boolean;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const key =
  'flex h-[68px] basis-[calc(33.33%-8px)] items-center justify-center rounded-[18px] border-2 border-line text-[30px] font-bold disabled:opacity-50';

/**
 * Big-key numeric pad, also driven by the digits, Backspace and Enter of a
 * physical keyboard, with an optional key to give up the question.
 * @param props Digit, erase, enter and give-up handlers.
 */
export function Keypad({ onDigit, onErase, onEnter, onSkip, disabled = false }: KeypadProps) {
  useEffect(() => {
    if (disabled)
      return;
    const listen = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key))
        onDigit(event.key);
      else if (event.key === 'Backspace')
        onErase();
      else if (event.key === 'Enter' && onEnter) {
        event.preventDefault();
        onEnter();
      }
    };
    window.addEventListener('keydown', listen);
    return () => window.removeEventListener('keydown', listen);
  }, [disabled, onDigit, onErase, onEnter]);

  return (
    <div className="flex flex-wrap gap-3">
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          className={`${key} bg-white text-ink active:bg-key`}
          aria-label={digit}
          disabled={disabled}
          onClick={() => onDigit(digit)}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        className={`${key} bg-key text-ink active:bg-line`}
        aria-label="Effacer le dernier chiffre"
        disabled={disabled}
        onClick={onErase}
      >
        <Icon name="delete" size={28} />
      </button>
      {onSkip && (
        <button
          type="button"
          className={`${key} border-danger-soft bg-danger-soft text-danger-bar active:border-danger-bar`}
          aria-label="C’est trop dur"
          title="C’est trop dur"
          disabled={disabled}
          onClick={onSkip}
        >
          <Icon name="ui/too-hard" size={32} />
        </button>
      )}
    </div>
  );
}
