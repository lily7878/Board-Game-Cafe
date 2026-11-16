import { useState } from 'react';
import { Check, CircleCheck, ClipboardList, Send, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../app/CartContext';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate, useSearchParams } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { apiRequest } from '../../shared/api/http';
import { formatMoney, formatTime, plural } from '../../shared/format';
import { useAction } from '../../shared/hooks/useAction';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Badge, Button, EmptyMessage, Modal, Skeleton } from '../../shared/ui';
import styles from './Orders.module.css';

const STEPS = [
  { status: 'PLACED', label: 'Trimisă' },
  { status: 'ACCEPTED', label: 'Acceptată' },
  { status: 'PREPARING', label: 'Preparare' },
  { status: 'READY', label: 'Gata' },
  { status: 'DELIVERED', label: 'Livrată' },
];
const BADGE = {
  PLACED: { tone: 'active', label: 'Trimisă' },
  ACCEPTED: { tone: 'reserved', label: 'Acceptată' },
  PREPARING: { tone: 'warning', label: 'În preparare' },
  READY: { tone: 'success', label: 'Gata' },
  DELIVERED: { tone: 'success', label: 'Livrată' },
  CANCELLED: { tone: 'neutral', label: 'Anulată' },
};

/**
 * 3g / 6b — this phone's orders, newest first, with a 5-step progress. Only a PLACED order
 * (not yet accepted by staff) can be changed or cancelled; Core enforces it with a 409 too.
 */
export function OrdersPage() {
  const orders = useApiQuery('/api/participant/orders');
  useLiveRefetch(orders.refetch, ['order.', 'session.']);
  const cart = useCart();
  const params = useSearchParams();
  const navigate = useNavigate();
  const { run, pending } = useAction();
  const [cancelling, setCancelling] = useState(null);

  const sent = params.get('sent');
  const list = [...(orders.data ?? [])].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));

  // 3f follow-up: after a timeout, did an order arrive after the attempt?
  const since = cart.unconfirmedSince ? new Date(cart.unconfirmedSince).getTime() - 120000 : null;
  const arrived = since ? list.find((o) => new Date(o.placedAt).getTime() >= since) : null;

  const cancel = (order) =>
    run(`cancel-${order.id}`, () => apiRequest(`/api/participant/orders/${order.id}/cancel`, { method: 'POST' }), {
      success: `Comanda #C-${order.id} a fost anulată.`,
      after: () => {
        setCancelling(null);
        orders.refetch();
      },
    });

  const edit = (order) => {
    cart.editOrder(order);
    navigate('/cart');
  };

  return (
    <MobileShell title="Comenzile mele">
      {sent && !cart.unconfirmedSince && (
        <p className={styles.flash} role="status">
          <CircleCheck size={18} aria-hidden /> {params.get('edited') ? 'Comanda a fost modificată.' : 'Comanda a fost trimisă. Coșul s-a golit.'}
        </p>
      )}

      {cart.unconfirmedSince && orders.data && (
        <div className={styles.check} role="status">
          {arrived ? (
            <>
              <p>
                <strong>Comanda ta a ajuns (#C-{arrived.id}).</strong> Poți goli coșul, ca să nu o trimiți de două ori.
              </p>
              <Button size="sm" onClick={cart.clear}>
                Golește coșul
              </Button>
            </>
          ) : (
            <>
              <p>
                <strong>Nu vedem încă o comandă nouă.</strong> Dacă nu apare în câteva secunde, o poți trimite din nou din coș.
              </p>
              <Button size="sm" variant="secondary" onClick={() => navigate('/cart')}>
                Înapoi la coș
              </Button>
            </>
          )}
        </div>
      )}

      {orders.loading && !orders.data ? (
        [1, 0.7].map((o) => (
          <div key={o} className={styles.card} style={{ opacity: o }}>
            <Skeleton width="40%" height={20} />
            <Skeleton width="100%" height={28} tone={2} />
            <Skeleton width="100%" height={70} />
          </div>
        ))
      ) : orders.error && !orders.data ? (
        <EmptyMessage icon={ClipboardList} title="Nu am putut încărca comenzile" action={<Button variant="secondary" onClick={orders.refetch}>Reîncearcă</Button>}>
          Verifică conexiunea și încearcă din nou.
        </EmptyMessage>
      ) : list.length === 0 ? (
        <EmptyMessage icon={ShoppingBag} title="Nicio comandă încă" action={<Button onClick={() => navigate('/menu')}>Vezi meniul</Button>}>
          Comenzile tale apar aici, cu progresul lor, imediat după ce le trimiți.
        </EmptyMessage>
      ) : (
        list.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            busy={pending === `cancel-${order.id}`}
            onEdit={() => edit(order)}
            onCancel={() => setCancelling(order)}
          />
        ))
      )}

      {cancelling && (
        <Modal open onClose={() => setCancelling(null)} icon={X} iconTone="error" title={`Anulezi comanda #C-${cancelling.id}?`} width={360}>
          <p className={styles.modalText}>Personalul nu a acceptat-o încă, deci nu se plătește nimic.</p>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Păstrez
            </Button>
            <Button submitting={pending === `cancel-${cancelling.id}`} onClick={() => cancel(cancelling)}>
              Anulează
            </Button>
          </div>
        </Modal>
      )}
    </MobileShell>
  );
}

function OrderCard({ order, busy, onEdit, onCancel }) {
  const badge = BADGE[order.status];
  const cancelled = order.status === 'CANCELLED';
  const reached = STEPS.findIndex((s) => s.status === order.status);
  const sub = cancelled
    ? `${formatTime(order.placedAt)} · ${order.cancellationReason === 'ALL_ITEMS_REJECTED' ? 'produsele nu au fost disponibile' : 'anulată de tine'}`
    : order.status === 'DELIVERED'
      ? `${formatTime(order.placedAt)} · livrată la ${formatTime(order.deliveredAt)}`
      : `${formatTime(order.placedAt)} · ${plural(order.items.reduce((n, i) => n + i.quantity, 0), 'produs', 'produse')} · ${formatMoney(order.total)}`;

  return (
    <article className={`${styles.card} ${cancelled ? styles.cardCancelled : ''}`}>
      <div className={styles.head}>
        <div>
          <h2>#C-{order.id}</h2>
          <span>{sub}</span>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      {!cancelled && (
        <ol className={styles.progress} aria-label={`Progres: ${badge.label}`}>
          {STEPS.map((step, index) => {
            const done = index <= reached;
            const last = index === reached;
            return (
              <li key={step.status} className={`${done ? styles.done : ''} ${last ? styles.current : ''}`}>
                <span className={styles.stepDot} aria-hidden>
                  {last && order.status === 'PLACED' && <Send size={13} />}
                  {last && order.status === 'DELIVERED' && <Check size={14} />}
                </span>
                <span className={styles.stepLabel}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className={styles.lines}>
        {order.items.map((item) => (
          <div key={item.id} className={`${styles.line} ${item.status === 'REJECTED' ? styles.rejected : ''}`}>
            <div>
              <span className={styles.lineName}>
                {item.productName} ×{item.quantity}
              </span>
              {item.status === 'REJECTED' && <span className={styles.reason}>Respinsă{item.rejectionReason ? `: ${item.rejectionReason}` : ''}</span>}
            </div>
            <strong>{formatMoney(item.status === 'REJECTED' ? 0 : item.lineTotal)}</strong>
          </div>
        ))}
      </div>

      {order.status === 'PLACED' && (
        <>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onEdit} disabled={busy}>
              Modifică
            </Button>
            <Button variant="secondary" className={styles.cancelButton} onClick={onCancel} disabled={busy}>
              Anulează
            </Button>
          </div>
          <p className={styles.note}>Se poate modifica doar până o acceptă personalul.</p>
        </>
      )}
    </article>
  );
}
