import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';

interface ProfileCardProps {
  name: string;
  colour: number;
  locked: boolean;
  onSelect: () => void;
}

/**
 * Child profile on the "who is signing in" screen.
 * @param props Name, avatar colour, whether a code is asked, and the selection handler.
 */
export function ProfileCard({ name, colour, locked, onSelect }: ProfileCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-4 rounded-[20px] border-2 border-line bg-white p-[18px] text-left text-ink"
    >
      <Avatar name={name} colour={colour} />
      <span className="flex-1 text-xl font-bold">{name}</span>
      {locked && <Icon name="lock" size={22} className="text-muted" label="Code secret demandé" />}
    </button>
  );
}

/**
 * Dark entry to the parent area.
 * @param props Selection handler.
 */
export function ParentEntry({ onSelect }: { onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="flex items-center gap-4 rounded-[20px] bg-ink p-[18px] text-left text-white">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand">
        <Icon name="lock" size={26} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-lg font-bold">Espace parent</span>
        <span className="text-[15px] text-line">Code parent à 4 chiffres</span>
      </span>
    </button>
  );
}
