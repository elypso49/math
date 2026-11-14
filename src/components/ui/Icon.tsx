const sources = import.meta.glob<string>('../../../assets/icons/{*,ui/*}.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const icons = Object.fromEntries(
  Object.entries(sources).map(([path, svg]) => [path.replace(/^.*assets\/icons\//, '').replace(/\.svg$/, ''), svg]),
);

/** Name of an icon file under assets/icons, without extension. */
export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'calendar'
  | 'chart-column'
  | 'check'
  | 'circle-check'
  | 'circle-x'
  | 'clock'
  | 'delete'
  | 'eye'
  | 'house'
  | 'info'
  | 'lock'
  | 'log-out'
  | 'play'
  | 'plus'
  | 'rotate-ccw'
  | 'target'
  | 'timer'
  | 'trending-up'
  | 'triangle-alert'
  | 'trophy'
  | 'user'
  | 'x'
  | 'ui/blanks'
  | 'ui/entrainement'
  | 'ui/evaluation'
  | 'ui/op-add'
  | 'ui/op-div'
  | 'ui/op-mul'
  | 'ui/op-sub'
  | 'ui/stats-overview'
  | 'ui/too-hard';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Accessible name; the icon is hidden from assistive technologies without it. */
  label?: string;
}

/**
 * Inline SVG icon from the project assets, drawn in the current text colour.
 * @param props Icon name, size in pixels and optional accessible label.
 */
export function Icon({ name, size = 24, className = '', label }: IconProps) {
  return (
    <span
      className={`icon inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: icons[name] ?? '' }}
    />
  );
}
