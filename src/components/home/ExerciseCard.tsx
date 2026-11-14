import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../ui/Icon';

interface ExerciseCardProps {
  /** Page opened by the card. */
  to?: string;
  /** Action run instead of opening a page. */
  onClick?: () => void;
  icon: IconName;
  title: string;
  subtitle: string;
  description?: string;
  action: string;
  highlighted?: boolean;
}

/**
 * Large card starting an exercise from the child's home screen.
 * @param props Destination or action, icon, wording and whether it is the suggested exercise.
 */
export function ExerciseCard({ to, onClick, icon, title, subtitle, description, action, highlighted = false }: ExerciseCardProps) {
  const className = `flex w-full flex-col gap-3.5 rounded-[20px] border-2 bg-white p-[22px] text-left text-ink no-underline ${highlighted ? 'border-brand' : 'border-line'}`;
  const content = (
    <>
      <div className="flex items-center gap-3.5">
        <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-[14px] ${highlighted ? 'bg-brand-soft' : 'bg-sand'}`}>
          <Icon name={icon} size={26} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xl font-bold">{title}</div>
          <div className="text-[15px] text-muted">{subtitle}</div>
        </div>
      </div>
      {description && <div className="text-[15px] text-muted">{description}</div>}
      <div className={`flex items-center gap-1.5 text-[17px] font-bold ${highlighted ? 'text-brand' : 'text-ink'}`}>
        {action}
        <Icon name="arrow-right" size={18} />
      </div>
    </>
  );

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
