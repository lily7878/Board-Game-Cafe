import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Drawer.module.css';

/**
 * 600px side panel from the right (radius 32px 0 0 32px). Esc and overlay click close it.
 * Layout slots: header (fixed), children (scrolls), footer (fixed).
 * On tablet it takes the full width.
 */
export function Drawer({ open, onClose, label, header, footer, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => {
      // Let an open modal on top handle its own Esc.
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"][aria-modal="true"]')) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside ref={panelRef} className={styles.panel} role="complementary" aria-label={label} tabIndex={-1}>
        <div className={styles.header}>{header}</div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}
