import type { MasteryBand } from '../../../features/learning/mastery';

/** Label and colours of each mastery band. */
export const BANDS: Record<MasteryBand, { label: string; text: string; bar: string }> = {
  unseen: { label: 'Pas encore vu', text: 'text-muted', bar: 'bg-track' },
  fragile: { label: 'Fragile', text: 'text-danger', bar: 'bg-danger-bar' },
  learning: { label: 'En cours', text: 'text-warning', bar: 'bg-warning-bar' },
  solid: { label: 'Solide', text: 'text-brand', bar: 'bg-brand' },
  automatic: { label: 'Automatisé', text: 'text-success', bar: 'bg-success' },
};

/**
 * Word describing a mastery band, coloured but never relying on colour alone.
 * @param props The band.
 */
export const MasteryBadge = ({ band }: { band: MasteryBand }) => (
  <span className={`text-[13px] font-bold whitespace-nowrap ${BANDS[band].text}`}>{BANDS[band].label}</span>
);
