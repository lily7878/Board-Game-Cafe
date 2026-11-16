import { useState } from 'react';
import { CalendarPlus, Flag } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { formatMoney } from '../../shared/format';
import { Button, Modal, useToast } from '../../shared/ui';
import styles from './Reports.module.css';

/**
 * 5d — End of Day confirmation. Core makes finalizing idempotent (201 the first time, 200 with the
 * same report afterwards), so unlike order processing a retry after a timeout is SAFE here:
 * the worst case is getting the already-saved report back.
 */
export function FinalizeDayModal({ preview, onClose, onDone }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { figures } = preview;

  async function finalize() {
    setSubmitting(true);
    setError(null);
    try {
      const report = await apiRequest(`/api/admin/business-days/${preview.businessDayId}/finalize`, { method: 'POST', timeoutMs: 30000 });
      toast.success(`Ziua #${report?.dayNumber ?? preview.dayNumber} a fost finalizată. A început Ziua #${preview.dayNumber + 1}.`);
      onDone();
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err.isConflict) {
        setError('Între timp s-a deschis o sesiune nouă, așa că ziua nu poate fi închisă acum. Închide sesiunile și încearcă din nou.');
        onDone();
      } else if (err.isUncertain) {
        setError('Serverul nu a confirmat. Poți încerca din nou fără grijă: dacă ziua a fost deja finalizată, primești același raport.');
      } else {
        setError(err.detail ?? 'Ziua nu a putut fi finalizată.');
      }
    }
  }

  return (
    <Modal
      open
      onClose={submitting ? undefined : onClose}
      icon={Flag}
      iconTone="espresso"
      title={
        <>
          Finalizezi Ziua #{preview.dayNumber}?<span className={styles.modalSub}>Acțiunea nu poate fi anulată.</span>
        </>
      }
      width={540}
    >
      <div className={styles.modalBody}>
        <div className={styles.totals}>
          <div>
            <span>Sesiuni închise</span>
            <strong>
              {figures.closedSessions} din {figures.closedSessions + preview.openSessions}
            </strong>
          </div>
          <div>
            <span>Produse</span>
            <strong>{formatMoney(figures.menuRevenue)}</strong>
          </div>
          <div>
            <span>Acces mese</span>
            <strong>{formatMoney(figures.accessFeeRevenue)}</strong>
          </div>
          <div className={styles.totalRow}>
            <span>Venit total</span>
            <strong>{formatMoney(figures.totalRevenue)}</strong>
          </div>
        </div>
        <p className={styles.hint}>
          <CalendarPlus size={16} aria-hidden /> După confirmare se salvează raportul și se deschide automat Ziua #{preview.dayNumber + 1}.
        </p>
        {error && (
          <div className={styles.errorBox} role="alert">
            {error}
          </div>
        )}
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Anulează
          </Button>
          <Button iconLeft={Flag} submitting={submitting} onClick={finalize}>
            {error ? 'Încearcă din nou' : 'Finalizează ziua'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
