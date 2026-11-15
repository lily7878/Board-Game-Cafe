import { useState } from 'react';
import { DoorOpen, Info } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { describeError } from '../../shared/api/errors';
import { formatMoney, plural, tableLabel } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, Modal, Skeleton, useToast } from '../../shared/ui';
import styles from './Tables.module.css';

/**
 * 2e — confirm before opening a table. Shows the CURRENT fee because Core copies it into the
 * session at this moment: later fee changes do not affect sessions already open.
 */
export function OpenTableModal({ table, onClose, onOpened }) {
  const toast = useToast();
  const settings = useApiQuery('/api/admin/settings');
  const day = useApiQuery('/api/admin/business-days/current');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function open() {
    setSubmitting(true);
    setError(null);
    try {
      const session = await apiRequest(`/api/admin/tables/${table.tableId}/sessions`, { method: 'POST' });
      toast.success(`Masa ${tableLabel(table.tableNumber)} a fost deschisă.`);
      onOpened(session);
    } catch (e) {
      setSubmitting(false);
      setError(describeError(e));
    }
  }

  const ready = settings.data && day.data;

  return (
    <Modal
      open
      onClose={submitting ? undefined : onClose}
      icon={DoorOpen}
      title={`Deschizi Masa ${tableLabel(table.tableNumber)}?`}
      width={460}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Anulează
          </Button>
          <Button onClick={open} submitting={submitting} disabled={!ready}>
            Deschide masa
          </Button>
        </>
      }
    >
      <div className={styles.openModal}>
        <p>{day.data ? `Se creează o sesiune nouă în Ziua #${day.data.dayNumber}.` : 'Se creează o sesiune nouă.'}</p>

        <div className={styles.infoBox}>
          <InfoRow label="Tarif acces">
            {settings.data ? `${formatMoney(settings.data.accessFeePrice)} / persoană` : <Skeleton width={120} />}
          </InfoRow>
          <InfoRow label="Capacitate">{plural(table.capacity, 'loc', 'locuri')}</InfoRow>
          <InfoRow label="Limită jocuri livrate">
            {settings.data ? settings.data.maxDeliveredGamesPerTable : <Skeleton width={30} />}
          </InfoRow>
        </div>

        <p className={styles.hintRow}>
          <Info size={14} aria-hidden />
          Tariful se fixează acum pentru această sesiune. O modificare ulterioară a tarifului nu o afectează.
        </p>

        {error && (
          <p className={styles.errorBox} role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className={styles.infoRow}>
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}
