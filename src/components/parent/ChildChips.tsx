import type { Child } from '../../types/math.types';
import { Icon } from '../ui/Icon';

interface ChildChipsProps {
  profiles: readonly Child[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

/**
 * Pill buttons picking the child whose statistics are shown.
 * @param props Children, the selected one, and the select and add handlers.
 */
export function ChildChips({ profiles, selectedId, onSelect, onAdd }: ChildChipsProps) {
  return (
    <div role="group" aria-label="Choix de l’enfant" className="flex flex-wrap gap-2">
      {profiles.map((child) => {
        const selected = child.id === selectedId;
        return (
          <button
            key={child.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(child.id)}
            className={`h-11 rounded-full border-2 px-4 text-[15px] font-bold ${selected ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'}`}
          >
            {child.name}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-11 items-center gap-1.5 rounded-full border-2 border-dashed border-stitch bg-transparent px-4 text-[15px] font-bold text-ink"
      >
        <Icon name="plus" size={18} />
        Ajouter un enfant
      </button>
    </div>
  );
}
