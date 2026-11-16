import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';

/**
 * Pill input with label above, optional leading icon and inline error.
 * type="password" gets a show/hide toggle; `suffix` is a unit shown inside (e.g. "lei").
 */
export function Input({ label, icon: Icon, error, suffix, type = 'text', className = '', ...rest }) {
  const id = useId();
  const errorId = `${id}-error`;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`${styles.field} ${className}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={`${styles.control} ${error ? styles.invalid : ''}`}>
        {Icon && <Icon size={18} className={styles.icon} aria-hidden />}
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          className={`${styles.input} ${isPassword && !reveal ? styles.secret : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
        {isPassword && (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Ascunde parola' : 'Afișează parola'}
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <div id={errorId} className={styles.error}>{error}</div>}
    </div>
  );
}
