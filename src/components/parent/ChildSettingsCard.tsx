import { useState } from 'react';
import { GRADES } from '../../features/learning/grades';
import { OPERATION_NAMES } from '../../features/stats/stats';
import { OPERATIONS, type Child, type Grade, type Operation } from '../../types/math.types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { InlineEdit } from './InlineEdit';

interface ChildSettingsCardProps {
  child: Child;
  busy: boolean;
  suggestedPin: () => string;
  onRename: (name: string) => Promise<boolean>;
  onSetPin: (pin: string | null) => Promise<boolean>;
  onSetGrade: (grade: Grade | null) => void;
  onToggleOperation: (operation: Operation) => void;
  onDelete: () => void;
}

type Editing = 'none' | 'name' | 'pin';

/**
 * Settings of one child: name, secret code, school year, practised operations and removal.
 * @param props The child, the pending state and the edit handlers.
 */
export function ChildSettingsCard({ child, busy, suggestedPin, onRename, onSetPin, onSetGrade, onToggleOperation, onDelete }: ChildSettingsCardProps) {
  const [editing, setEditing] = useState<Editing>('none');
  const close = (done: boolean) => done && setEditing('none');

  return (
    <div className="flex flex-col gap-3.5 rounded-[18px] bg-white p-[18px]">
      {editing === 'name' ? (
        <InlineEdit
          label="Prénom"
          initial={child.name}
          busy={busy}
          onSave={(name) => void onRename(name).then(close)}
          onCancel={() => setEditing('none')}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">{child.name}</div>
          <Button variant="outline" onClick={() => setEditing('name')}>
            Modifier le nom
          </Button>
        </div>
      )}

      {editing === 'pin' ? (
        <InlineEdit
          label="Code secret (4 chiffres)"
          initial={child.pin ?? suggestedPin()}
          pin
          busy={busy}
          onSave={(pin) => void onSetPin(pin).then(close)}
          onCancel={() => setEditing('none')}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-muted">Code secret</span>
            <span className="flex items-center gap-2 text-xl font-bold tracking-[2px]">
              <Icon name={child.pin ? 'lock' : 'user'} size={18} />
              {child.pin ?? 'Aucun'}
            </span>
          </div>
          <div className="flex gap-2">
            {child.pin && (
              <Button variant="outline" onClick={() => setEditing('pin')}>
                Modifier
              </Button>
            )}
            <Button
              variant="outline"
              className="border-0 bg-brand-soft text-success"
              disabled={busy}
              onClick={() => (child.pin ? void onSetPin(null) : setEditing('pin'))}
            >
              {child.pin ? 'Retirer le code' : 'Ajouter un code'}
            </Button>
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-muted">Classe</span>
        <select
          value={child.grade ?? ''}
          disabled={busy}
          onChange={(event) => onSetGrade((event.target.value || null) as Grade | null)}
          className="h-11 rounded-xl border-2 border-line bg-white px-3 text-base font-bold text-ink"
        >
          <option value="">Non renseignée</option>
          {GRADES.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-[13px] text-muted">Opérations des entraînements</legend>
        <div className="flex flex-wrap gap-2">
          {OPERATIONS.map((operation) => {
            const active = child.operations.includes(operation);
            return (
              <button
                key={operation}
                type="button"
                aria-pressed={active}
                disabled={busy || (active && child.operations.length === 1)}
                onClick={() => onToggleOperation(operation)}
                className={`h-10 rounded-full border-2 px-3.5 text-sm font-bold ${active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'}`}
              >
                {OPERATION_NAMES[operation]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button type="button" onClick={onDelete} disabled={busy} className="self-start text-sm font-bold text-danger underline">
        Supprimer ce profil
      </button>
    </div>
  );
}
