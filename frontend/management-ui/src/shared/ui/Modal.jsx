import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

/**
 * Centered dialog. Header = icon in a 52px circle + 22/800 title.
 *  - blocking: no close on Esc / overlay click (e.g. session expired, 7f)
 *  - actions: right-aligned footer
 */
export function Modal({
  open,
  onClose,
  title,
  icon: Icon,
  iconTone = 'rose',
  width = 480,
  blocking = false,
  actions,
  children,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    dialogRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !blocking) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, blocking, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={`${styles.overlay} ${blocking ? styles.blockingOverlay : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !blocking) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
      >
        {(Icon || title) && (
          <div className={styles.header}>
            {Icon && (
              <span className={`${styles.iconCircle} ${styles[iconTone]}`}>
                <Icon size={24} aria-hidden />
              </span>
            )}
            {title && <h2 className={styles.title}>{title}</h2>}
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
