import styles from './Spinner.module.css';

/** Ring spinner (18px, 2.5px border by default). Inherits text colour. */
export function Spinner({ size = 18, label = 'Se încarcă' }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  );
}
