import { useState } from 'react';
import { ArrowLeft, Info, Minus, Plus, X } from 'lucide-react';
import { Redirect, useNavigate } from '../../app/router';
import { apiRequest } from '../../shared/api/http';
import { formatMoney, plural } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, Skeleton } from '../../shared/ui';
import { MobileShell } from '../../app/shell/MobileShell';
import styles from './Bill.module.css';

const STEPS = ['Persoane', 'Rezumat', 'Confirmare'];

/**
 * 3i / 6a / 3j — closing the bill in 3 steps: how many people pay the access fee (physical people,
 * not connected phones) -> summary -> confirmation. Confirming starts the checkout: new orders and
 * game requests are blocked for the whole table and the number of people is locked.
 */
export function CheckoutPage() {
  const bill = useApiQuery('/api/participant/sessions/current/bill');
  const current = useApiQuery('/api/participant/sessions/current');
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [persons, setPersons] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (bill.loading && !bill.data) {
    return (
      <MobileShell title="Checkout" back="/bill">
        <Skeleton width="100%" height={220} />
      </MobileShell>
    );
  }
  if (!bill.data) return <Redirect to="/bill" />;
  const b = bill.data;
  if (b.sessionStatus !== 'ACTIVE') return <Redirect to="/bill" />;

  const count = persons ?? b.persons ?? current.data?.participants.length ?? 1;
  const fees = count * Number(b.accessFeeUnitPrice);
  const total = Number(b.menuTotal) + fees;

  /** Step 1 -> 2: the declared number is saved on the server (Core computes every total). */
  async function savePersons() {
    setBusy(true);
    setError(null);
    try {
      if (count !== b.persons) await apiRequest('/api/participant/sessions/current/fees', { method: 'PUT', body: { persons: count } });
      await bill.refetch();
      setStep(1);
    } catch (err) {
      setError(err.isConflict ? 'Numărul de persoane nu mai poate fi schimbat. Cereți ajutorul personalului.' : 'Nu am putut salva numărul de persoane. Încearcă din nou.');
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest('/api/participant/sessions/current/checkout', { method: 'POST' });
      navigate(result?.paymentAllowed ? '/payment' : '/bill', { replace: true });
    } catch (err) {
      setBusy(false);
      if (err.isUncertain) setError('Nu am primit confirmarea. Verifică nota înainte să încerci din nou.');
      else if (err.isConflict) setError('Nota s-a schimbat între timp. Verifică rezumatul și încearcă din nou.');
      else setError('Nota nu a putut fi închisă. Încearcă din nou.');
      bill.refetch();
    }
  }

  return (
    <MobileShell title="Checkout" back={step === 0 ? '/bill' : undefined}>
      <div className={styles.progress} aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={i <= step ? styles.progressOn : ''} />
        ))}
      </div>
      <p className={styles.stepLabel}>
        Pas {step + 1} din 3 · {STEPS[step]}
      </p>

      {step === 0 && (
        <>
          <h2 className={styles.question}>Câte persoane plătesc accesul?</h2>
          <p className={styles.muted}>Numărați toți cei de la masă, nu doar telefoanele conectate.</p>
          <section className={`${styles.card} ${styles.bigStepper}`}>
            <div>
              <button type="button" onClick={() => setPersons(Math.max(1, count - 1))} disabled={count <= 1} aria-label="Mai puține persoane">
                <Minus size={24} />
              </button>
              <strong aria-live="polite">{count}</strong>
              <button type="button" onClick={() => setPersons(Math.min(100, count + 1))} aria-label="Mai multe persoane">
                <Plus size={24} />
              </button>
            </div>
            <p>
              {count} × {formatMoney(b.accessFeeUnitPrice)} = <strong>{formatMoney(fees)} acces</strong>
            </p>
          </section>
        </>
      )}

      {step > 0 && (
        <>
          <h2 className={styles.question}>{step === 1 ? 'Verificați nota' : 'Închidem nota mesei?'}</h2>
          <section className={styles.card}>
            <div className={styles.summaryRow}>
              <span>Produse</span>
              <strong>{formatMoney(b.menuTotal)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Acces · {plural(count, 'persoană', 'persoane')}</span>
              <strong>{formatMoney(b.feesTotal ?? fees)}</strong>
            </div>
            {Number(b.pendingOrdersValue) > 0 && (
              <div className={styles.summaryRow}>
                <span>Comenzi încă în lucru</span>
                <strong>+ {formatMoney(b.pendingOrdersValue)}</strong>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <strong>{formatMoney(b.total ?? total)}</strong>
            </div>
          </section>
          {step === 1 && Number(b.pendingOrdersValue) > 0 && (
            <p className={styles.note}>
              <Info size={16} aria-hidden /> Comenzile în lucru se adaugă la total când sunt livrate; plata se deblochează după aceea.
            </p>
          )}
          {step === 2 && (
            <p className={styles.warning}>
              <Info size={18} aria-hidden /> După confirmare, nimeni de la masă nu mai poate comanda sau cere jocuri. Numărul de persoane rămâne {count}.
            </p>
          )}
        </>
      )}

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.wizardActions}>
        {step > 0 && (
          <button type="button" className={styles.roundButton} onClick={() => setStep(step - 1)} aria-label="Înapoi" disabled={busy}>
            <ArrowLeft size={20} />
          </button>
        )}
        {step === 0 && (
          <Button size="lg" fullWidth submitting={busy} onClick={savePersons}>
            Continuă
          </Button>
        )}
        {step === 1 && (
          <Button size="lg" fullWidth onClick={() => setStep(2)}>
            Continuă
          </Button>
        )}
        {step === 2 && (
          <Button size="lg" fullWidth submitting={busy} onClick={confirm}>
            Confirmă și închide nota
          </Button>
        )}
      </div>
      {step === 0 ? (
        <button type="button" className={styles.linkButton} onClick={() => navigate('/bill')}>
          <X size={16} aria-hidden /> Înapoi la notă
        </button>
      ) : (
        step === 2 && <p className={styles.centerNote}>Plata se face integral, la pasul următor.</p>
      )}
    </MobileShell>
  );
}
