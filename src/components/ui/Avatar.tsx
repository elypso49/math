/** Background and letter colours of the child avatars, in order of creation. */
export const AVATAR_PALETTE = [
  'bg-brand-soft text-success',
  'bg-warning-soft text-warning',
  'bg-info-soft text-info',
  'bg-danger-soft text-danger',
];

interface AvatarProps {
  name: string;
  colour: number;
  size?: 'medium' | 'large';
}

/**
 * Round badge holding the first letter of a child's name.
 * @param props Name, palette index and size.
 */
export function Avatar({ name, colour, size = 'medium' }: AvatarProps) {
  const dimensions = size === 'large' ? 'h-16 w-16 text-[28px]' : 'h-14 w-14 text-2xl';
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${dimensions} ${AVATAR_PALETTE[colour % AVATAR_PALETTE.length]}`}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}
