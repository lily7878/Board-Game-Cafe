import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleAlert, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

/**
 * Bottom-right toasts. success = green pill, error = espresso card.
 * Usage: const toast = useToast(); toast.success('Salvat'); toast.error('…', { title: 'Timeout' });
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone, message, { duration = tone === 'error' ? 7000 : 4000, title } = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, tone, message, title }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (msg, opts) => push('success', msg, opts),
      error: (msg, opts) => push('error', msg, opts),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.tone]}`}
            role={t.tone === 'error' ? 'alert' : 'status'}
          >
            {t.tone === 'success' ? (
              <CircleCheck size={18} aria-hidden />
            ) : (
              <CircleAlert size={18} className={styles.errorIcon} aria-hidden />
            )}
            <span className={styles.message}>
              {t.title && <strong className={styles.title}>{t.title}</strong>}
              {t.message}
            </span>
            <button type="button" className={styles.close} onClick={() => dismiss(t.id)} aria-label="Închide">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
