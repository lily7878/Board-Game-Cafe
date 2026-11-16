import styles from './Skeleton.module.css';

/** Pill placeholder block. Use inside white cards while LOADING. */
export function Skeleton({ width = '100%', height = 14, tone = 1, style }) {
  return (
    <span
      className={`${styles.skeleton} ${tone === 2 ? styles.tone2 : ''}`}
      style={{ width, height, ...style }}
      aria-hidden
    />
  );
}
