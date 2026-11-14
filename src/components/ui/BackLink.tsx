import { Link } from 'react-router-dom';
import { Icon } from './Icon';

interface BackLinkProps {
  to: string;
  label: string;
}

/**
 * Discreet "back" link shown at the top of a screen.
 * @param props Destination and wording.
 */
export function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link to={to} className="flex items-center gap-1.5 self-start text-[15px] text-muted no-underline">
      <Icon name="arrow-left" size={18} />
      {label}
    </Link>
  );
}
