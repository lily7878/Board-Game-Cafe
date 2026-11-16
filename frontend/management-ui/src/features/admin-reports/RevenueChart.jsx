import { useState } from 'react';
import { formatMoney } from '../../shared/format';
import styles from './Reports.module.css';

const compact = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 });

/**
 * "Venit pe zile" — one bar per simulated business day (never per hour). Finalized days are
 * solid; the open day is hatched because its figure is preliminary until End of Day.
 * Single series: no legend; exact values on hover/focus; the history table below is the
 * accessible table view of the same numbers.
 *   bars: [{ key, label, value, preliminary }]
 */
export function RevenueChart({ bars }) {
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const peak = bars.reduce((best, b) => (b.value > (best?.value ?? -1) ? b : best), null);

  return (
    <div className={styles.chart} role="img" aria-label={bars.map((b) => `${b.label}: ${formatMoney(b.value)}`).join('; ')}>
      {bars.map((bar) => {
        const height = Math.max(6, Math.round((bar.value / max) * 100));
        const labelled = bar.preliminary || bar === peak;
        return (
          <div
            key={bar.key}
            className={styles.column}
            onMouseEnter={() => setActive(bar.key)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(bar.key)}
            onBlur={() => setActive(null)}
            tabIndex={0}
          >
            <div className={styles.plot}>
              {active === bar.key && (
                <div className={styles.tooltip} role="tooltip">
                  <strong>{bar.label}</strong>
                  {formatMoney(bar.value)}
                  {bar.preliminary && <span>preliminar</span>}
                </div>
              )}
              {labelled && active !== bar.key && <span className={styles.barValue}>{compact.format(bar.value)}</span>}
              <span
                className={`${styles.bar} ${bar.preliminary ? styles.barPreliminary : ''} ${active === bar.key ? styles.barActive : ''}`}
                style={{ height: `${height}%` }}
              />
            </div>
            <span className={`${styles.dayLabel} ${bar.preliminary ? styles.dayLabelCurrent : ''}`}>{bar.short}</span>
          </div>
        );
      })}
    </div>
  );
}
