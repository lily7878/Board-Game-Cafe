import styles from './Toggle.module.css';

/**
 * On/off switch (38x22 desktop). Rendered as role="switch" so screen readers announce
 * "on/off" instead of "checked". `label` is the visible text on the left.
 */
export function Toggle({ checked, onChange, label, disabled = false, size = 'md' }) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : 'Comutator'}
      disabled={disabled}
      className={`${styles.track} ${styles[size]} ${checked ? styles.on : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} />
    </button>
  );

  if (!label) return control;
  return (
    <label className={`${styles.row} ${disabled ? styles.rowDisabled : ''}`}>
      <span className={styles.label}>{label}</span>
      {control}
    </label>
  );
}
