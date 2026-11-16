import { useState } from 'react';
import { ArrowRight, ChefHat, ChevronDown, ChevronUp, Hourglass, Lock, Minus, Plus, Receipt, Undo2 } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useParticipant } from '../../app/ParticipantContext';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { apiRequest } from '../../shared/api/http';
import { formatMoney, plural, tableLabel } from '../../shared/format';
import { useAction } from '../../shared/hooks/useAction';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, EmptyMessage, Skeleton } from '../../shared/ui';
import styles from './Bill.module.css';

/**
 * 3h / 3k — the shared bill. While the table is ACTIVE it is an estimate (delivered orders + the
 * access fee fixed when the table was opened × declared persons). In CHECKOUT_PENDING it shows what
 * still blocks the payment; the page refreshes itself on every live event of the table.
 */
export function BillPage() {
  const bill = useApiQuery('/api/participant/sessions/current/bill');
  const current = useApiQuery('/api/participant/sessions/current');
  const orders = useApiQuery('/api/participant/orders');
  useLiveRefetch(bill.refetch, () => true);
  useLiveRefetch(current.refetch, () => true);
  useLiveRefetch(orders.refetch, ['order.']);
  const navigate = useNavigate();

  if (bill.loading && !bill.data) {
    return (
      <MobileShell title="Nota mesei">
        <Skeleton width="100%" height={150} />
        <Skeleton width="100%" height={90} tone={2} />
      </MobileShell>
    );
  }
  if (!bill.data) {
    return (
      <MobileShell title="Nota mesei">
        <EmptyMessage icon={Receipt} title="Nu am putut încărca nota" action={<Button variant="secondary" onClick={bill.refetch}>Reîncearcă</Button>}>
          Verifică conexiunea și încearcă din nou.
        </EmptyMessage>
      </MobileShell>
    );
  }

  const b = bill.data;
  return b.sessionStatus === 'CHECKOUT_PENDING' ? (
    <CheckoutBill bill={b} current={current.data} myOrders={orders.data ?? []} onPay={() => navigate('/payment')} />
  ) : (
    <ActiveBill bill={b} current={current.data} onChanged={bill.refetch} onCheckout={() => navigate('/checkout')} />
  );
}

function ActiveBill({ bill, current, onChanged, onCheckout }) {
  const { run, pending } = useAction();
  const connected = current?.participants.length ?? null;
  const persons = bill.persons;

  const setPersons = (value) =>
    run('persons', () => apiRequest('/api/participant/sessions/current/fees', { method: 'PUT', body: { persons: value } }), { after: onChanged });

  return (
    <MobileShell title="Nota mesei">
      <section className={styles.hero}>
        <span className={styles.heroLabel}>Total estimativ · Masa {tableLabel(bill.tableNumber)}</span>
        <strong className={styles.heroTotal}>{formatMoney(bill.total)}</strong>
        <span className={styles.heroSub}>
          Produse {formatMoney(bill.menuTotal)} + acces {persons ? `${persons} × ${formatMoney(bill.accessFeeUnitPrice)}` : 'după numărul de persoane'}
        </span>
      </section>

      {Number(bill.pendingOrdersValue) > 0 && (
        <p className={styles.note}>
          <Hourglass size={16} aria-hidden /> Comenzile în lucru ({formatMoney(bill.pendingOrdersValue)}) se adaugă la notă după ce sunt livrate.
        </p>
      )}

      <section className={styles.card}>
        <div className={styles.personsRow}>
          <div>
            <h2>Câte persoane sunteți?</h2>
            <p>Includeți și pe cei fără telefon.{connected != null && ` Conectați: ${connected}`}</p>
          </div>
          <div className={styles.stepper}>
            <button type="button" onClick={() => setPersons(Math.max(1, (persons ?? 1) - 1))} disabled={!bill.canEditPersons || pending === 'persons' || (persons ?? 1) <= 1} aria-label="Mai puține persoane">
              <Minus size={18} />
            </button>
            <strong aria-live="polite">{persons ?? '–'}</strong>
            <button type="button" onClick={() => setPersons(Math.min(100, (persons ?? 0) + 1))} disabled={!bill.canEditPersons || pending === 'persons'} aria-label="Mai multe persoane">
              <Plus size={18} />
            </button>
          </div>
        </div>
        <p className={styles.fixed}>
          <Lock size={14} aria-hidden /> Tarif fixat la deschiderea mesei: {formatMoney(bill.accessFeeUnitPrice)} / persoană
        </p>
      </section>

      <Participants bill={bill} />

      <Button size="lg" fullWidth iconRight={ArrowRight} onClick={onCheckout}>
        Închide nota și plătește
      </Button>
    </MobileShell>
  );
}

function CheckoutBill({ bill, current, myOrders, onPay }) {
  const openMine = myOrders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const othersOpen = Math.max(0, bill.obstacles.openOrders - openMine.length);
  const games = (current?.games ?? []).filter((g) => ['REQUESTED', 'RESERVED', 'DELIVERED'].includes(g.status));
  const returned = (current?.games ?? []).filter((g) => g.status === 'RETURNED');
  const blockers = openMine.length + othersOpen + games.length + (bill.obstacles.personsMissing ? 1 : 0);

  return (
    <MobileShell title="Nota mesei">
      <section className={styles.card}>
        <span className={styles.lockedBadge}>
          <Receipt size={14} aria-hidden /> Notă închisă · plată în așteptare
        </span>
        <strong className={styles.bigTotal}>{formatMoney(bill.total)}</strong>
        <span className={styles.muted}>{plural(bill.persons ?? 0, 'persoană', 'persoane')} · tarifele sunt blocate</span>
      </section>

      {!bill.paymentAllowed && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Înainte de plată</h2>
          {openMine.map((o) => (
            <p key={o.id} className={styles.blocker}>
              <ChefHat size={16} aria-hidden /> Comanda #C-{o.id} {o.status === 'PLACED' ? 'așteaptă confirmarea' : o.status === 'READY' ? 'e gata de servit' : 'se prepară'}
            </p>
          ))}
          {othersOpen > 0 && (
            <p className={styles.blocker}>
              <ChefHat size={16} aria-hidden /> {othersOpen === 1 ? 'O comandă de la masă e în lucru' : `${othersOpen} comenzi de la masă sunt în lucru`}
            </p>
          )}
          {games.map((g) => (
            <p key={g.requestId} className={styles.blocker}>
              <Undo2 size={16} aria-hidden /> {g.status === 'DELIVERED' ? `${g.title} trebuie returnat la bar` : `Cererea pentru ${g.title} e în curs`}
            </p>
          ))}
          {returned.map((g) => (
            <p key={g.requestId} className={`${styles.blocker} ${styles.blockerDone}`}>
              <span className={styles.doneDot} aria-hidden>✓</span> {g.title} returnat
            </p>
          ))}
          <p className={styles.muted}>Personalul rezolvă restul. Pagina se actualizează singură.</p>
        </section>
      )}

      <Participants bill={bill} collapsed title="Detalii notă" />

      <Button size="lg" fullWidth locked={!bill.paymentAllowed} onClick={onPay}>
        Plătește {formatMoney(bill.total)}
      </Button>
      {!bill.paymentAllowed && (
        <p className={styles.centerNote}>Plata se deblochează după ce se rezolvă {blockers === 1 ? 'ultimul punct' : `cele ${blockers} puncte`}.</p>
      )}
    </MobileShell>
  );
}

/** Per-participant shares (delivered products only); the access fee is shared, not per phone. */
function Participants({ bill, collapsed = false, title = 'Detalii pe participanți' }) {
  const [open, setOpen] = useState(!collapsed);
  const { participant } = useParticipant();
  return (
    <section className={styles.card}>
      <button type="button" className={styles.collapse} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {title} {open ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
      </button>
      {open && (
        <div className={styles.people}>
          {bill.participants.map((p) => {
            const orders = new Set(p.lines.map((l) => l.orderId)).size;
            return (
              <div key={p.participantId} className={styles.person}>
                <span className={styles.avatar} aria-hidden>
                  {p.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className={styles.personText}>
                  <strong>
                    {p.displayName}
                    {p.participantId === participant?.participantId && ' (tu)'}
                  </strong>
                  <span>{orders === 0 ? 'fără comenzi livrate' : plural(orders, 'comandă', 'comenzi')}</span>
                </span>
                <strong>{formatMoney(p.menuTotal)}</strong>
              </div>
            );
          })}
          {bill.feesLocked && (
            <div className={styles.person}>
              <span className={styles.avatar} aria-hidden>
                <Lock size={14} />
              </span>
              <span className={styles.personText}>
                <strong>Acces</strong>
                <span>
                  {bill.persons} × {formatMoney(bill.accessFeeUnitPrice)}
                </span>
              </span>
              <strong>{formatMoney(bill.feesTotal)}</strong>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
