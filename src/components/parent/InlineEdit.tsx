import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';

interface InlineEditProps {
  label: string;
  initial: string;
  /** Four-digit code instead of free text. */
  pin?: boolean;
  busy?: boolean;
  submitLabel?: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

const PIN_PATTERN = /^\d{4}$/;

/**
 * Small form editing one value in place, a name or a four-digit code.
 * @param props Label, initial value, kind of value and the save and cancel handlers.
 */
export function InlineEdit({ label, initial, pin = false, busy = false, submitLabel = 'Enregistrer', onSave, onCancel }: InlineEditProps) {
  const [value, setValue] = useState(initial);
  const valid = pin ? PIN_PATTERN.test(value) : value.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (valid)
      onSave(value);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <label className="flex flex-col gap-1.5 text-[13px] text-muted">
        {label}
        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(pin ? event.target.value.replace(/\D/g, '').slice(0, 4) : event.target.value)}
          inputMode={pin ? 'numeric' : 'text'}
          maxLength={pin ? 4 : 40}
          className={`h-12 rounded-xl border-2 border-line bg-white px-3.5 text-lg font-bold text-ink ${pin ? 'tracking-[0.3em]' : ''}`}
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" variant="outline" className="border-brand bg-brand text-white" disabled={!valid || busy}>
          {submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
