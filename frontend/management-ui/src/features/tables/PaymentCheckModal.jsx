import { Check, CircleAlert, Clock, Info, RefreshCw, SearchCheck, X } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { formatMoney, formatTime, formatTimeSeconds, tableLabel } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Badge, Button, Modal, Skeleton } from '../../shared/ui';
import styles from './PaymentCheck.module.css';

const ATTEMPT = {
  SUCCEEDED: { tone: 'success', label: 'Reușită', icon: Check },
  PENDING: { tone: 'warning', label: 'În curs', icon: Clock },
  FAILED: { tone: 'error', label: 'Eșuată', icon: X },
};

/** What staff should tell the customer, decided only from Core's records (never from the phone). */
function verdict(payments, sessionStatus) {
  const succeeded = payments.find((p) => p.status === 'SUCCEEDED');
  if (succeeded || sessionStatus === 'CLOSED') {
    return {
      tone: 'success',
      icon: Check,
      title: 'Plata a fost încasată',
      text: 'Sesiunea este închisă. Clientul nu trebuie să plătească din nou.',
      amount: succeeded?.amount,
    };
  }
  if (payments.some((p) => p.status === 'PENDING')) {
    return {
      tone: 'warning',
      icon: Clock,
      title: 'Plată în curs de confirmare',
      text: 'Nu cere clientului să plătească din nou. Verifică din nou peste câteva secunde.',
    };
  }
  if (payments[0]?.status === 'FAILED') {
    return {
      tone: 'error',
      icon: CircleAlert,
      title: 'Plata nu a reușit',
      text: `${payments[0].failureReason ? `${payments[0].failureReason}. ` : ''}Clientul poate încerca din nou din telefon.`,
    };
  }
  return { tone: 'neutral', icon: Info, title: 'Nicio încercare de plată', text: 'Clientul nu a apăsat încă „Plătește”.' };
}

/** "pay-7f3a…c21e": enough of the idempotency key to match it with the customer's screen. */
const shortKey = (key) => (key ? `pay-${String(key).slice(0, 4)}…${String(key).slice(-4)}` : '—');

/**
 * 5b — "Did this table pay?" when the customer's phone shows an uncertain result.
 * Reads GET /api/admin/sessions/{id}/payments (the contract the handoff marks as proposed and
 * Core implements). It stays usable after the session closes, which is why it is not inside the
 * table drawer (the drawer disappears when the table becomes free).
 */
export function PaymentCheckModal({ sessionId, onClose }) {
  const details = useApiQuery(`/api/admin/sessions/${sessionId}`);
  const payments = useApiQuery(`/api/admin/sessions/${sessionId}/payments`);
  const refetch = () => {
    details.refetch();
    payments.refetch();
  };
  useLiveRefetch(refetch, (e) => e.sessionId === sessionId);

  const session = details.data;
  const list = [...(payments.data ?? [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const loading = (payments.loading && !payments.data) || (details.loading && !details.data);
  const result = payments.data ? verdict(list, session?.status ?? list[0]?.sessionStatus) : null;
  const Icon = result?.icon;

  return (
    <Modal
      open
      onClose={onClose}
      icon={SearchCheck}
      title={
        <>
          Verificare plată{session ? ` · Masa ${tableLabel(session.tableNumber)}` : ''}
          {session && (
            <span className={styles.sub}>
              Sesiunea S-{session.sessionId} · Ziua #{session.dayNumber} · deschisă {formatTime(session.startedAt)}
            </span>
          )}
        </>
      }
      width={620}
    >
      <div className={styles.body}>
        {loading ? (
          <Skeleton width="100%" height={92} />
        ) : payments.error ? (
          <div className={styles.errorBox} role="alert">
            Nu am putut citi plățile: {payments.error.detail} Nu presupune nimic până nu reușește verificarea.
          </div>
        ) : (
          <>
            <div className={`${styles.verdict} ${styles[result.tone]}`} role="status">
              <span className={styles.verdictIcon} aria-hidden>
                <Icon size={22} />
              </span>
              <div className={styles.grow}>
                <strong>{result.title}</strong>
                <p>{result.text}</p>
              </div>
              {result.amount != null && <span className={styles.amount}>{formatMoney(result.amount)}</span>}
            </div>

            <div>
              <h3 className={styles.overline}>Încercări de plată</h3>
              <div className={styles.attempts}>
                {list.length === 0 && <p className={styles.none}>Nicio încercare înregistrată.</p>}
                {list.map((p) => {
                  const a = ATTEMPT[p.status];
                  return (
                    <div key={p.id} className={styles.attempt}>
                      <strong>{formatTimeSeconds(p.createdAt)}</strong>
                      <code title={p.idempotencyKey}>{shortKey(p.idempotencyKey)}</code>
                      <strong>{formatMoney(p.amount)}</strong>
                      <Badge tone={a.tone} icon={a.icon}>
                        {a.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <p className={styles.note}>
          <Info size={16} aria-hidden /> Rezultatul vine din Core, nu din telefonul clientului. Spune-i clientului ce vezi aici.
        </p>

        <div className={styles.actions}>
          <Button variant="secondary" iconLeft={RefreshCw} submitting={payments.loading && Boolean(payments.data)} onClick={refetch}>
            Verifică din nou
          </Button>
          <Button onClick={onClose}>Am înțeles</Button>
        </div>
      </div>
    </Modal>
  );
}
