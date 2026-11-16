import { Minus, Plus } from 'lucide-react';
import styles from './Stepper.module.css';

/** − value + pill. Buttons disable themselves at min / max. */
export function Stepper({ value, onChange, min = 0, max = Infinity, label, size = 42 }) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button
        type="button"
        className={styles.button}
        style={{ width: size, height: size }}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Scade"
      >
        <Minus size={16} />
      </button>
      <span className={styles.value} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={styles.button}
        style={{ width: size, height: size }}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Crește"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
