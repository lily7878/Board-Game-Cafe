import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dices, X } from 'lucide-react';
import { tableLabel } from '../../../shared/format';
import { describeError } from '../../../shared/api/errors';
import { useTableAccess } from './useTableAccess';
import styles from './QrFullscreen.module.css';

/** 5a — QR/PIN on the whole screen, to turn the tablet towards the customers. Esc closes. */
export function QrFullscreen({ table, onClose }) {
  const { pin, qr, error } = useTableAccess(table.tableId);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // close only the fullscreen, not the drawer under it
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return createPortal(
    <div className={styles.screen} role="dialog" aria-modal="true" aria-label={`QR Masa ${tableLabel(table.tableNumber)}`}>
      <span className={styles.decoA} aria-hidden />
      <span className={styles.decoB} aria-hidden />
      <button type="button" className={styles.close} onClick={onClose}>
        <X size={18} aria-hidden />
        Închide (Esc)
      </button>
      <div className={styles.brand}>
        <span className={styles.logo}>
          <Dices size={22} aria-hidden />
        </span>
        Board Game Café
      </div>

      <div className={styles.qrCard}>{qr ? <img src={qr} alt="Cod QR pentru intrarea la masă" /> : <span className={styles.wait} />}</div>

      <div className={styles.side}>
        <div>
          <div className={styles.label}>Masa</div>
          <div className={styles.table}>{tableLabel(table.tableNumber)}</div>
        </div>
        <div>
          <div className={styles.label}>PIN</div>
          <div className={styles.pin}>
            {(pin ?? '····').split('').map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        </div>
        <p className={styles.text}>{error ? describeError(error) : 'Scanați codul, introduceți PIN-ul și numele vostru.'}</p>
      </div>
    </div>,
    document.body,
  );
}
