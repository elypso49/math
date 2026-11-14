import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * In-app modal window in the app's look, closed by Escape or a tap outside it.
 * @param props Open state, title, close handler and content.
 */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog)
      return;
    if (open && !dialog.open)
      dialog.showModal();
    else if (!open && dialog.open)
      dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-32px)] max-w-[400px] rounded-3xl border-0 bg-paper p-0 text-ink backdrop:bg-ink/50"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={titleId} className="m-0 text-[22px] leading-tight font-bold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Shows the confirmation in red, for an action that destroys something. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Yes-or-no question asked in an in-app modal window.
 * @param props Open state, wording, tone and the two handlers.
 */
export function ConfirmDialog({ open, title, message, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} onClose={onCancel}>
      <p className="m-0 text-[17px] leading-normal text-muted">{message}</p>
      <div className="flex flex-col gap-2.5">
        <Button onClick={onConfirm} className={danger ? 'bg-danger-bar hover:bg-danger' : ''}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </Dialog>
  );
}
