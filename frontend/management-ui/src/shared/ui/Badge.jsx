import styles from './Badge.module.css';

/**
 * Status pill. Always label + icon (never colour alone).
 *  tone: success | active | warning | reserved | neutral | error
 */
export function Badge({ tone = 'neutral', icon: Icon, children }) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {Icon ? <Icon size={12} strokeWidth={2.5} aria-hidden /> : <span className={styles.dot} />}
      {children}
    </span>
  );
}
