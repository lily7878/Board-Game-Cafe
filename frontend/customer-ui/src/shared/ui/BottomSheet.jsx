import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './BottomSheet.module.css';

/**
 * Mobile bottom sheet: radius 36px on the top corners, 44x5 handle. Closes on the overlay,
 * on Escape, and returns focus to what was focused before.
 */
export function BottomSheet({ open, onClose, label, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className={styles.sheet} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <span className={styles.handle} aria-hidden />
        {children}
      </div>
    </div>,
    document.body,
  );
}
