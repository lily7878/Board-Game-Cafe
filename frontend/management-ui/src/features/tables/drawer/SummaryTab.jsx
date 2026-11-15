import { Check, Lock, Receipt, X } from 'lucide-react';
import { useNavigate } from '../../../app/router';
import { formatMoney, plural } from '../../../shared/format';
import { ORDER_NEXT_STEP, ORDER_STATUS, SESSION_STATUS } from '../../../shared/statuses';
import { Button } from '../../../shared/ui';
import styles from './TableDrawer.module.css';

const OPEN_ORDER = (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED';

/** 1e — Rezumat; becomes the checkout view (2d) while the session is CHECKOUT_PENDING. */
export function SummaryTab({ data, checkout, actions, pending }) {
  return checkout ? (
    <CheckoutView data={data} actions={actions} pending={pending} />
  ) : (
    <ActiveSummary data={data} actions={actions} pending={pending} />
  );
}

function ActiveSummary({ data, actions, pending }) {
  const navigate = useNavigate();
  const { details, bill, orders, requests } = data;
  const newOrders = orders.filter((o) => o.status === 'PLACED');
  const waitingGames = requests.filter((r) => r.status === 'REQUESTED');

  return (
    <>
      <dl className={styles.infoBox}>
        <Row label="Stare sesiune">{SESSION_STATUS[details.status]?.label}</Row>
        <Row label="Zi de business">Ziua #{details.dayNumber}</Row>
        <Row label="Tarif acces (fixat la deschidere)">{formatMoney(details.accessFeeUnitPrice)} / persoană</Row>
        <Row label="Persoane declarate">{details.persons ?? 'Nedeclarat încă'}</Row>
        <Row label="Jocuri livrate">
          {details.gamesAtTable} din {details.maxDeliveredGames} permise
        </Row>
      </dl>

      {bill && (
        <dl className={styles.totalsBox}>
          <Row label="Produse (poziții acceptate)">{formatMoney(bill.menuTotal)}</Row>
          <Row label="Acces mese">{bill.persons != null ? formatMoney(bill.feesTotal) : 'după declararea persoanelor'}</Row>
          <Row label="Total preliminar" strong>
            {formatMoney(bill.total)}
          </Row>
        </dl>
      )}

      <section className={styles.attention}>
        <h3 className={styles.overline}>Necesită atenție</h3>
        {newOrders.length === 0 && waitingGames.length === 0 && <p className={styles.muted}>Nimic de rezolvat acum.</p>}
        {newOrders.map((order) => (
          <div key={order.id} className={styles.attentionRow}>
            <span>
              <strong>Comandă nouă #C-{order.id}</strong> · {plural(order.items.length, 'poziție', 'poziții')}
            </span>
            <Button size="sm" onClick={() => navigate(`/orders?order=${order.id}`)}>
              Procesează
            </Button>
          </div>
        ))}
        {waitingGames.map((request) => (
          <div key={request.id} className={styles.attentionRow}>
            <span>
              <strong>Cerere joc: {request.gameTitle}</strong> · în așteptare
            </span>
            <Button size="sm" submitting={pending === `game-${request.id}`} onClick={() => actions.reserve(request)}>
              Rezervă
            </Button>
          </div>
        ))}
      </section>
    </>
  );
}

/** 2d — what still blocks the payment, the final bill and the reopen option (footer). */
function CheckoutView({ data, actions, pending }) {
  const { bill, orders, requests } = data;
  const openOrders = orders.filter(OPEN_ORDER);
  const gamesOut = requests.filter((r) => ['REQUESTED', 'RESERVED', 'DELIVERED'].includes(r.status));
  const personsMissing = bill?.obstacles.personsMissing;
  const nothingBlocks = openOrders.length === 0 && gamesOut.length === 0 && !personsMissing;

  return (
    <>
      <p className={styles.warningBox}>
        <Receipt size={18} aria-hidden />
        Clientul a început checkout-ul. Comenzile și cererile noi sunt blocate până la plată sau redeschidere.
      </p>

      <section className={styles.attention}>
        <h3 className={styles.overline}>Ce blochează plata</h3>
        {nothingBlocks && (
          <div className={`${styles.blockRow} ${styles.blockDone}`}>
            <span className={styles.blockDot}><Check size={12} /></span>
            Nimic nu mai blochează plata. Clientul poate plăti din telefon.
          </div>
        )}
        {openOrders.map((order) => {
          const next = ORDER_NEXT_STEP[order.status];
          return (
            <div key={order.id} className={styles.blockRow}>
              <span className={`${styles.blockDot} ${styles.blockDotOpen}`}><X size={12} /></span>
              <span className={styles.blockText}>
                <strong>Comanda #C-{order.id}</strong> este {ORDER_STATUS[order.status].label.toLowerCase()}
              </span>
              {next && (
                <Button size="sm" submitting={pending === `order-${order.id}`} onClick={() => actions.advanceOrder(order)}>
                  {next.label}
                </Button>
              )}
            </div>
          );
        })}
        {gamesOut.map((request) => (
          <div key={request.id} className={styles.blockRow}>
            <span className={`${styles.blockDot} ${styles.blockDotOpen}`}><X size={12} /></span>
            <span className={styles.blockText}>
              <strong>{request.gameTitle}</strong> {request.status === 'DELIVERED' ? 'este încă la masă' : 'are o cerere deschisă'}
            </span>
            {request.status === 'DELIVERED' && (
              <Button size="sm" submitting={pending === `game-${request.id}`} onClick={() => actions.askReturn(request)}>
                Returnat
              </Button>
            )}
          </div>
        ))}
        {personsMissing && (
          <div className={styles.blockRow}>
            <span className={`${styles.blockDot} ${styles.blockDotOpen}`}><X size={12} /></span>
            <span className={styles.blockText}>Numărul de persoane nu a fost declarat</span>
          </div>
        )}
      </section>

      {bill && (
        <dl className={styles.totalsBox}>
          <Row label="Persoane declarate">{bill.persons ?? '—'}</Row>
          <Row label={`Acces · ${bill.persons ?? 0} × ${formatMoney(bill.accessFeeUnitPrice)}`}>{formatMoney(bill.feesTotal)}</Row>
          <Row label="Produse">{formatMoney(bill.menuTotal)}</Row>
          <Row label="Total de plată" strong big>
            {formatMoney(bill.total)}
          </Row>
        </dl>
      )}

      <p className={styles.hint}>
        <Lock size={14} aria-hidden />
        Clientul nu mai poate modifica tarifele, nici după redeschidere.
      </p>
    </>
  );
}

function Row({ label, strong, big, children }) {
  return (
    <div className={`${styles.row} ${strong ? styles.rowStrong : ''}`}>
      <dt>{label}</dt>
      <dd className={big ? styles.big : ''}>{children}</dd>
    </div>
  );
}
