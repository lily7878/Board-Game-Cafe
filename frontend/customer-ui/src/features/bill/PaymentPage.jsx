import { useState } from 'react';
import { Check, CircleCheck, CreditCard, Hand, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { useParticipant } from '../../app/ParticipantContext';
import { Redirect } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { apiRequest } from '../../shared/api/http';
import { formatMoney, formatTime, tableLabel } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, Skeleton, Toggle } from '../../shared/ui';
import styles from './Bill.module.css';

const ATTEMPT_KEY = 'bgc.payment';

function loadAttempt() {
  try {
    return JSON.parse(sessionStorage.getItem(ATTEMPT_KEY));
  } catch {
    return null;
  }
}
function saveAttempt(attempt) {
  try {
    if (attempt) sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
    else sessionStorage.removeItem(ATTEMPT_KEY);
  } catch {
    // private mode: the attempt lives in memory only
  }
}
const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/**
 * 4k / 4l / 4m — simulated payment of the whole bill.
 *
 * Every attempt has an idempotency key, kept in sessionStorage until the result is known.
 * Core replays the result for a key it has already seen (even after the table closed), so after a
 * timeout "Verifică din nou" re-sends the SAME key: it can only report the first attempt, never
 * charge twice. A NEW attempt ("Plătește din nou") stays locked while the outcome is unknown (4m).
 */
export function PaymentPage() {
  const { participant, end } = useParticipant();
  const bill = useApiQuery('/api/participant/sessions/current/bill');
  const [attempt, setAttempt] = useState(loadAttempt); // { key, amount, phase: 'unknown' }
  const [result, setResult] = useState(null); // { phase: 'succeeded' | 'failed', payment }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  async function send(key, amount) {
    setBusy(true);
    setError(null);
    const pending = { key, amount, phase: 'sending' };
    saveAttempt(pending);
    setAttempt(pending);
    try {
      const payment = await apiRequest('/api/participant/sessions/current/pay', {
        method: 'POST',
        timeoutMs: 20000,
        body: { idempotencyKey: key, expectedTotal: amount, simulateFailure },
      });
      if (payment.status === 'SUCCEEDED' || payment.status === 'FAILED') {
        saveAttempt(null);
        setAttempt(null);
        setResult({ phase: payment.status === 'SUCCEEDED' ? 'succeeded' : 'failed', payment });
      } else {
        markUnknown(key, amount);
      }
    } catch (err) {
      if (err.isUncertain || err.kind === 'network') {
        markUnknown(key, amount);
      } else {
        saveAttempt(null);
        setAttempt(null);
        if (err.isConflict && /already been paid/i.test(err.detail ?? '')) setResult({ phase: 'succeeded', payment: { amount } });
        else if (err.isConflict && /total has changed/i.test(err.detail ?? '')) {
          setError('Totalul notei s-a schimbat. Verifică noua sumă înainte să plătești.');
          bill.refetch();
        } else if (err.isConflict) {
          setError('Plata nu este posibilă încă: mai sunt comenzi sau jocuri nerezolvate.');
          bill.refetch();
        } else setError('Plata nu a putut fi trimisă. Încearcă din nou.');
      }
    } finally {
      setBusy(false);
    }
  }

  function markUnknown(key, amount) {
    const unknown = { key, amount, phase: 'unknown' };
    saveAttempt(unknown);
    setAttempt(unknown);
  }

  // ---- 4l: success -------------------------------------------------------------------------
  if (result?.phase === 'succeeded') {
    return (
      <div className={`${styles.resultPage} ${styles.resultPageOk}`}>
        <span className={`${styles.resultIcon} ${styles.resultOk}`} aria-hidden>
          <Check size={44} />
        </span>
        <h1 className={styles.resultTitle}>Plata a fost confirmată</h1>
        <p className={styles.muted}>Mulțumim că ați jucat la noi!</p>
        <section className={styles.card}>
          <div className={styles.summaryRow}>
            <span>Masa</span>
            <strong>{tableLabel(participant?.tableNumber)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Total plătit</span>
            <strong>{formatMoney(result.payment.amount)}</strong>
          </div>
          {result.payment.completedAt && (
            <div className={styles.summaryRow}>
              <span>Ora</span>
              <strong>{formatTime(result.payment.completedAt)}</strong>
            </div>
          )}
        </section>
        <p className={styles.note}>
          <CircleCheck size={16} aria-hidden /> Nota mesei e închisă, iar accesul de pe toate telefoanele s-a încheiat.
        </p>
        <Button size="lg" fullWidth onClick={() => end('paid')}>
          Închide
        </Button>
      </div>
    );
  }

  // ---- 4m: outcome unknown -----------------------------------------------------------------
  if (attempt?.phase === 'unknown') {
    return (
      <div className={styles.resultPage}>
        <span className={`${styles.resultIcon} ${styles.resultUnknown}`} aria-hidden>
          ?
        </span>
        <h1 className={styles.resultTitle}>Plata nu a putut fi confirmată</h1>
        <p className={styles.muted}>
          Nu am primit răspunsul de la server. Plata poate să fi reușit sau nu. <strong>Nu încercați să plătiți din nou.</strong>
        </p>
        <section className={styles.callStaff}>
          <span aria-hidden>
            <Hand size={20} />
          </span>
          <div>
            <strong>Chemați personalul</strong>
            <p>Personalul vede rezultatul real al plății pentru Masa {tableLabel(participant?.tableNumber)} și vă spune dacă s-a încasat.</p>
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.summaryRow}>
            <span>Suma încercată</span>
            <strong>{formatMoney(attempt.amount)}</strong>
          </div>
        </section>
        <Button size="lg" fullWidth variant="secondary" iconLeft={RefreshCw} submitting={busy} onClick={() => send(attempt.key, attempt.amount)}>
          Verifică din nou
        </Button>
        <Button size="lg" fullWidth locked>
          Plătește din nou
        </Button>
        <p className={styles.centerNote}>„Verifică din nou” întreabă de aceeași plată; nu poate încasa de două ori.</p>
      </div>
    );
  }

  // ---- 4k: pay ------------------------------------------------------------------------------
  if (bill.loading && !bill.data) {
    return (
      <MobileShell title="Plată" back="/bill">
        <Skeleton width="100%" height={160} />
      </MobileShell>
    );
  }
  const b = bill.data;
  if (!b || b.sessionStatus !== 'CHECKOUT_PENDING') return <Redirect to="/bill" />;

  return (
    <MobileShell title="Plată" back="/bill">
      <section className={styles.hero}>
        <span className={styles.heroLabel}>De plată · Masa {tableLabel(b.tableNumber)}</span>
        <strong className={styles.heroTotal}>{formatMoney(b.total)}</strong>
        <span className={styles.heroSub}>Plată integrală, simulată</span>
      </section>

      {b.paymentAllowed ? (
        <p className={styles.resolved}>
          <CircleCheck size={18} aria-hidden /> Toate comenzile și jocurile sunt rezolvate
        </p>
      ) : (
        <p className={styles.warning}>
          <TriangleAlert size={18} aria-hidden /> Mai sunt comenzi sau jocuri nerezolvate. Plata se deblochează după ce le rezolvă personalul.
        </p>
      )}

      {result?.phase === 'failed' && (
        <div className={styles.error} role="alert">
          <X size={16} aria-hidden /> Plata a fost refuzată{result.payment.failureReason ? `: ${result.payment.failureReason}` : ''}. Poți încerca din nou.
        </div>
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <h2 className={styles.cardTitle}>Metodă (simulare)</h2>
      <div className={styles.method} aria-checked="true" role="radio">
        <span aria-hidden>
          <CreditCard size={20} />
        </span>
        <strong>Card</strong>
        <Check size={20} aria-hidden />
      </div>
      <Toggle label="Simulează o plată refuzată (demo)" checked={simulateFailure} onChange={setSimulateFailure} />

      <Button size="lg" fullWidth locked={!b.paymentAllowed} submitting={busy} onClick={() => send(newKey(), Number(b.total))}>
        {b.paymentAllowed ? `Plătește ${formatMoney(b.total)}` : 'Plata e blocată'}
      </Button>
      <p className={styles.centerNote}>Nu închideți pagina până primiți rezultatul.</p>
    </MobileShell>
  );
}
