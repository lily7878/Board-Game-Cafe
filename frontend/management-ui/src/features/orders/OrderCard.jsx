import { forwardRef } from 'react';
import { ChevronDown, ChevronUp, CircleHelp, Receipt } from 'lucide-react';
import { formatAgo, formatMoney, formatTime, tableLabel } from '../../shared/format';
import { ORDER_NEXT_STEP, ORDER_STATUS } from '../../shared/statuses';
import { Badge, Button } from '../../shared/ui';
import { DecisionPanel } from './DecisionPanel';
import styles from './Orders.module.css';

/**
 * One order in the "În lucru" list (2g). Collapsed: summary + the single next action.
 * Expanded: a new order shows the per-line decision panel, a later one its lines and times.
 */
export const OrderCard = forwardRef(function OrderCard(
  { order, now, expanded, blocksCheckout, onToggle, onAdvance, advancing, processing },
  ref,
) {
  const isNew = order.status === 'PLACED';
  const draft = isNew ? processing.draftFor(order) : null;
  const unknown = draft?.uncertain === 'unknown';
  const status = ORDER_STATUS[order.status];
  const next = ORDER_NEXT_STEP[order.status];

  const avatarClass = expanded ? styles.avatarOn : blocksCheckout ? styles.avatarCheckout : '';
  const cardClass = [styles.card, expanded ? styles.cardOpen : '', unknown ? styles.cardUnknown : ''].join(' ');

  return (
    <article ref={ref} className={cardClass} aria-label={`Comanda #C-${order.id}`}>
      <div className={styles.cardHead}>
        <span className={`${styles.avatar} ${avatarClass}`} aria-hidden>
          {tableLabel(order.tableNumber)}
        </span>

        <div className={styles.cardMain}>
          <div className={styles.titleRow}>
            <strong className={styles.code}>#C-{order.id}</strong>
            <span className={styles.meta}>
              Masa {tableLabel(order.tableNumber)} · {formatTime(order.placedAt)} · {order.participantName}
              {expanded && isNew && ` · ${formatAgo(order.placedAt, now)}`}
            </span>
            {blocksCheckout && (
              <span className={styles.checkoutTag}>
                <Receipt size={11} aria-hidden /> Blochează checkout
              </span>
            )}
          </div>
          {!(expanded && isNew) && (
            <div className={styles.summary}>
              {order.items.map((item, index) => (
                <span key={item.id}>
                  {index > 0 && ' · '}
                  {item.status === 'REJECTED' ? <s>{`${item.productName} ×${item.quantity}`}</s> : `${item.productName} ×${item.quantity}`}
                </span>
              ))}
            </div>
          )}
        </div>

        {unknown ? (
          <Badge tone="neutral" icon={CircleHelp}>
            Stare neconfirmată
          </Badge>
        ) : (
          <Badge tone={isNew ? 'active' : status.tone} icon={status.icon}>
            {status.label}
          </Badge>
        )}

        {!(expanded && isNew) && (
          <>
            <span className={styles.total}>{formatMoney(order.total)}</span>
            {isNew && !unknown && (
              <Button size="sm" onClick={onToggle}>
                Procesează
              </Button>
            )}
            {next && (
              <Button size="sm" variant="secondary" submitting={advancing} onClick={() => onAdvance(order)}>
                {next.label}
              </Button>
            )}
          </>
        )}

        <button
          type="button"
          className={styles.chevron}
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? 'Restrânge comanda' : 'Extinde comanda'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && isNew && <DecisionPanel order={order} draft={draft} processing={processing} />}
      {expanded && !isNew && <OrderLines order={order} />}
    </article>
  );
});

/** Expanded view of an order that was already decided: its lines and kitchen timeline. */
function OrderLines({ order }) {
  const steps = [
    ['Plasată', order.placedAt],
    ['Acceptată', order.acceptedAt],
    ['Gata', order.readyAt],
  ].filter(([, at]) => at);

  return (
    <div className={styles.panel}>
      {order.items.map((item) => (
        <div key={item.id} className={`${styles.lineRow} ${item.status === 'REJECTED' ? styles.lineRejected : ''}`}>
          <span className={styles.decisionName}>
            {item.status === 'REJECTED' ? (
              <s>
                {item.productName} ×{item.quantity}
              </s>
            ) : (
              <>
                {item.productName} <span className={styles.qty}>×{item.quantity}</span>
              </>
            )}
            {item.status === 'REJECTED' && <span className={styles.reasonInline}> · respinsă{item.rejectionReason ? `: ${item.rejectionReason}` : ''}</span>}
          </span>
          <span className={`${styles.decisionPrice} ${item.status === 'REJECTED' ? styles.struck : ''}`}>{formatMoney(item.lineTotal)}</span>
        </div>
      ))}
      <p className={styles.timeline}>{steps.map(([label, at]) => `${label} ${formatTime(at)}`).join(' · ')}</p>
    </div>
  );
}
