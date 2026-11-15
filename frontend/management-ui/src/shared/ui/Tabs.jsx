import styles from './Tabs.module.css';

/**
 * Segmented tabs.
 *  tabs: [{ value, label, count? }]
 *  surface: cream (on white cards) | tinted (on the cream page)
 */
export function Tabs({ tabs, value, onChange, surface = 'cream', ariaLabel }) {
  return (
    <div className={`${styles.tabs} ${styles[surface]}`} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`${styles.tab} ${selected ? styles.selected : ''}`}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
            {tab.count != null && <span className={styles.count}>{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
