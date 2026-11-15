import { useState } from 'react';
import { Ban, Undo2 } from 'lucide-react';
import { apiRequest } from '../../../shared/api/http';
import { ORDER_NEXT_STEP } from '../../../shared/statuses';
import { Button, Input, Modal } from '../../../shared/ui';
import styles from './TableDrawer.module.css';

const CONDITIONS = [
  { value: 'USABLE', label: 'În stare bună', hint: 'Exemplarul revine imediat în catalog.' },
  { value: 'UNDER_MAINTENANCE', label: 'Necesită verificare', hint: 'Lipsesc piese sau e deteriorat ușor.' },
  { value: 'UNAVAILABLE', label: 'Indisponibil', hint: 'Exemplarul iese din circulație.' },
];

/**
 * Staff actions on orders and game requests, shared by every drawer tab.
 * Reject needs a reason and return needs the copy condition, so those two open a small modal;
 * `modals` must be rendered by the caller.
 */
export function useSessionActions({ run, refetch }) {
  const [rejecting, setRejecting] = useState(null);
  const [returning, setReturning] = useState(null);

  const post = (path, body) => apiRequest(path, { method: 'POST', body });

  const actions = {
    advanceOrder: (order) => {
      const next = ORDER_NEXT_STEP[order.status];
      return run(`order-${order.id}`, () =>
        apiRequest(`/api/admin/orders/${order.id}/status`, { method: 'PATCH', body: { status: next.status } }), {
        success: `Comanda #C-${order.id} ${next.done}.`,
        after: refetch,
      });
    },
    reserve: (request) =>
      run(`game-${request.id}`, () => post(`/api/admin/game-requests/${request.id}/reserve`), {
        success: `${request.gameTitle}: exemplar rezervat.`,
        after: refetch,
      }),
    deliver: (request) =>
      run(`game-${request.id}`, () => post(`/api/admin/game-requests/${request.id}/deliver`), {
        success: `${request.gameTitle} a fost livrat la masă.`,
        after: refetch,
      }),
    askReject: setRejecting,
    askReturn: setReturning,
  };

  const modals = (
    <>
      {rejecting && (
        <RejectModal
          request={rejecting}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) =>
            run(`game-${rejecting.id}`, () => post(`/api/admin/game-requests/${rejecting.id}/reject`, { reason }), {
              success: `Cererea pentru ${rejecting.gameTitle} a fost respinsă.`,
              after: () => {
                setRejecting(null);
                refetch();
              },
            })
          }
        />
      )}
      {returning && (
        <ReturnModal
          request={returning}
          onClose={() => setReturning(null)}
          onConfirm={(conditionStatus) =>
            run(`game-${returning.id}`, () => post(`/api/admin/game-requests/${returning.id}/return`, { conditionStatus }), {
              success: `${returning.gameTitle} a fost returnat.`,
              after: () => {
                setReturning(null);
                refetch();
              },
            })
          }
        />
      )}
    </>
  );

  return { actions, modals };
}

function RejectModal({ request, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return setError('Scrie motivul; clientul îl vede în aplicație.');
    setBusy(true);
    await onConfirm(reason.trim());
    setBusy(false);
  };

  return (
    <Modal open onClose={busy ? undefined : onClose} icon={Ban} iconTone="error" title={`Respingi cererea pentru ${request.gameTitle}?`} width={460}>
      <form className={styles.modalForm} onSubmit={submit} noValidate>
        <Input
          label="Motiv"
          placeholder="ex. Toate exemplarele sunt la alte mese"
          value={reason}
          maxLength={200}
          onChange={(e) => setReason(e.target.value)}
          error={error}
          autoFocus
        />
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Anulează
          </Button>
          <Button type="submit" submitting={busy}>
            Respinge cererea
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ReturnModal({ request, onClose, onConfirm }) {
  const [condition, setCondition] = useState('USABLE');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await onConfirm(condition);
    setBusy(false);
  };

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      icon={Undo2}
      title={`${request.gameTitle} a fost returnat`}
      width={480}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Anulează
          </Button>
          <Button onClick={submit} submitting={busy}>
            Confirmă returnarea
          </Button>
        </>
      }
    >
      <fieldset className={styles.conditions}>
        <legend className={styles.conditionsLegend}>În ce stare e exemplarul{request.copyInventoryCode ? ` ${request.copyInventoryCode}` : ''}?</legend>
        {CONDITIONS.map((c) => (
          <label key={c.value} className={`${styles.condition} ${condition === c.value ? styles.conditionOn : ''}`}>
            <input type="radio" name="condition" value={c.value} checked={condition === c.value} onChange={() => setCondition(c.value)} />
            <span>
              <strong>{c.label}</strong>
              <small>{c.hint}</small>
            </span>
          </label>
        ))}
      </fieldset>
    </Modal>
  );
}
