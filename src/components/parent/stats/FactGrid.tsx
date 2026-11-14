import type { FactCell } from '../../../features/stats/operationStats';
import { formatDuration } from '../../../features/stats/stats';
import type { Operation } from '../../../types/math.types';
import { MAX_TABLE } from '../../../features/learning/skills';

/** Sequential ramp of the grid, one hue from light to dark. */
const RAMP = ['#E3F1EC', '#B9DDD0', '#7FBFA9', '#3F9A80', '#1F5C3A'];
const STEPS = [0.25, 0.5, 0.75, 0.9, Infinity];
const RAMP_LABELS = ['< 25 %', '25–50 %', '50–75 %', '75–90 %', '≥ 90 %'];

const shade = (score: number) => RAMP[STEPS.findIndex((step) => score < step)]!;

interface FactGridProps {
  operation: Extract<Operation, 'mul' | 'div'>;
  cells: readonly FactCell[];
}

const describe = (operation: FactGridProps['operation'], cell: FactCell) => {
  const text = operation === 'mul' ? `${cell.row} × ${cell.column}` : `${cell.row * cell.column} ÷ ${cell.row}`;
  if (!cell.mastery)
    return `${text} : jamais demandé`;
  const { attempts, accuracy, medianMs, score } = cell.mastery;
  const time = medianMs === null ? '' : `, ${formatDuration(medianMs)}`;
  return `${text} : maîtrise ${Math.round(score * 100)} %, ${attempts} réponse${attempts > 1 ? 's' : ''}, réussite ${Math.round(accuracy * 100)} %${time}`;
};

/**
 * Twelve-by-twelve grid of every table fact, shaded by mastery; hovering a cell gives its detail.
 * @param props Operation and the cells of the grid.
 */
export function FactGrid({ operation, cells }: FactGridProps) {
  const numbers = Array.from({ length: MAX_TABLE }, (_, index) => index + 1);
  return (
    <section className="flex flex-col gap-3 rounded-[18px] bg-white p-[18px]" aria-label="Carte des faits">
      <div className="flex flex-col gap-0.5">
        <h3 className="m-0 text-[17px] font-bold">Carte des {operation === 'mul' ? 'produits' : 'divisions'}</h3>
        <p className="m-0 text-[13px] text-muted">
          {operation === 'mul' ? 'Ligne × colonne' : 'Diviseur en ligne, quotient en colonne'} · plus c’est foncé, mieux c’est su
        </p>
      </div>
      <div className="grid gap-[2px] text-[10px]" style={{ gridTemplateColumns: `16px repeat(${MAX_TABLE}, minmax(0, 1fr))` }}>
        <span />
        {numbers.map((number) => (
          <span key={number} className="text-center text-muted">
            {number}
          </span>
        ))}
        {numbers.map((row) => (
          <div key={row} className="contents">
            <span className="text-right text-muted">{row}</span>
            {cells
              .filter((cell) => cell.row === row)
              .map((cell) => (
                <span
                  key={cell.column}
                  title={describe(operation, cell)}
                  aria-label={describe(operation, cell)}
                  role="img"
                  className={`aspect-square rounded-[3px] ${cell.mastery ? '' : 'border border-dashed border-line'}`}
                  style={{ background: cell.mastery ? shade(cell.mastery.score) : 'transparent' }}
                />
              ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted" aria-hidden="true">
        {RAMP.map((colour, index) => (
          <span key={colour} className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-[3px]" style={{ background: colour }} />
            {RAMP_LABELS[index]}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-[3px] border border-dashed border-line" />
          jamais demandé
        </span>
      </div>
    </section>
  );
}
