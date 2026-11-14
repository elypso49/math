import type { EncouragementId } from '../../features/encouragement/encouragements';

const sources = import.meta.glob<string>('../../../assets/icons/encouragement/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});

const urlOf = (file: string) =>
  Object.entries(sources).find(([path]) => path.endsWith(`/${file}.svg`))?.[1] ?? '';

interface EncouragementIconProps {
  id: EncouragementId;
  obtained?: boolean;
  size?: number;
}

/**
 * Picture of an encouragement, coloured once obtained and greyed while locked.
 * @param props Encouragement, whether it is obtained, and size in pixels.
 */
export const EncouragementIcon = ({ id, obtained = true, size = 36 }: EncouragementIconProps) => (
  <img src={urlOf(`${id}-${obtained ? 'obtenu' : 'verrouille'}`)} width={size} height={size} alt="" aria-hidden="true" />
);
