import styles from './EmptyMessage.module.css';

/** EMPTY state: icon circle + 24/800 title + secondary text + optional CTA. Left-aligned. */
export function EmptyMessage({ icon: Icon, title, children, action }) {
  return (
    <div className={styles.empty}>
      {Icon && (
        <span className={styles.circle}>
          <Icon size={36} aria-hidden />
        </span>
      )}
      <h3 className={styles.title}>{title}</h3>
      {children && <p className={styles.text}>{children}</p>}
      {action}
    </div>
  );
}
