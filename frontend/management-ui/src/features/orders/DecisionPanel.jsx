import { Check, CircleAlert, CloudOff, RefreshCw, X } from 'lucide-react';
import { formatMoney, plural } from '../../shared/format';
import { Button } from '../../shared/ui';
import styles from './Orders.module.css';

/**
 * 2g / 2h — one Accept/Reject segmented control per line, a mandatory reason for rejected
 * lines (the customer sees it) and a single "Confirmă deciziile" for the whole set.
 */
export function DecisionPanel({ order, draft, processing }) {
  const { setDecision, confirm, verify, pending } = processing;
  const unknown = draft.uncertain === 'unknown';
  const submitting = pending === `process-${order.id}`;
  const locked = unknown || submitting;

  const accepted = order.items.filter((i) => draft.decisions[i.id].accepted);
  const rejectedCount = order.items.length - accepted.length;
  const totalAfter = accepted.reduce((sum, i) => sum + Number(i.lineTotal), 0);

  return (
    <div className={styles.panel}>
      {unknown && (
        <div className={styles.timeoutBanner} role="alert">
          <CloudOff size={20} aria-hidden />
          <p>
            <strong>Serverul nu a răspuns la timp.</strong> Nu știm dacă deciziile au fost aplicate. Nu retrimitem automat.
            Verifică starea înainte de a încerca din nou.
          </p>
        </div>
      )}
      {draft.uncertain === 'checked' && (
        <div className={styles.infoBanner} role="status">
          <CircleAlert size={18} aria-hidden />
          <p>Am verificat: comanda este încă nouă, deci deciziile nu au fost aplicate. Le poți confirma din nou.</p>
        </div>
      )}
      {draft.changed && !unknown && (
        <div className={styles.infoBanner} role="status">
          <CircleAlert size={18} aria-hidden />
          <p>Clientul a modificat comanda între timp. Verifică din nou pozițiile înainte de a confirma.</p>
        </div>
      )}

      {!unknown && <div className={styles.overline}>Decide pentru fiecare poziție</div>}

      {order.items.map((item) => {
        const decision = draft.decisions[item.id];
        const missingReason = draft.showErrors && !decision.accepted && !decision.reason.trim();
        return (
          <div key={item.id} className={`${styles.decision} ${unknown ? styles.dimmed : ''}`}>
            <div className={styles.decisionRow}>
              <span className={styles.decisionName}>
                {item.productName} <span className={styles.qty}>×{item.quantity}</span>
                {unknown && !decision.accepted && decision.reason && <span className={styles.reasonInline}> · {decision.reason}</span>}
              </span>
              <span className={`${styles.decisionPrice} ${decision.accepted ? '' : styles.struck}`}>{formatMoney(item.lineTotal)}</span>
              <div className={styles.segmented} role="radiogroup" aria-label={`Decizie pentru ${item.productName}`}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={decision.accepted}
                  disabled={locked}
                  className={`${styles.segment} ${decision.accepted ? styles.segmentAccept : ''}`}
                  onClick={() => setDecision(order, item.id, { accepted: true })}
                >
                  <Check size={14} aria-hidden /> Acceptă
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!decision.accepted}
                  disabled={locked}
                  className={`${styles.segment} ${decision.accepted ? '' : styles.segmentReject}`}
                  onClick={() => setDecision(order, item.id, { accepted: false })}
                >
                  <X size={14} aria-hidden /> Respinge
                </button>
              </div>
            </div>

            {!decision.accepted && !unknown && (
              <label className={styles.reasonRow}>
                <span className={styles.reasonLabel}>Motiv (vizibil clientului)</span>
                <span className={styles.reasonField}>
                  <input
                    className={`${styles.reasonInput} ${missingReason ? styles.reasonInvalid : ''}`}
                    value={decision.reason}
                    maxLength={500}
                    disabled={submitting}
                    placeholder="ex. S-a terminat stocul"
                    aria-invalid={missingReason}
                    autoFocus={!decision.reason}
                    onChange={(e) => setDecision(order, item.id, { reason: e.target.value })}
                  />
                  {missingReason && <span className={styles.reasonError}>Scrie motivul respingerii.</span>}
                </span>
              </label>
            )}
          </div>
        );
      })}

      <div className={styles.panelFoot}>
        {unknown ? (
          <>
            <p className={styles.footHint}>
              Dacă comanda e deja procesată, vei vedea noua stare. Dacă e tot nouă, poți confirma din nou.
            </p>
            <Button variant="secondary" disabled>
              Confirmă din nou
            </Button>
            <Button iconLeft={RefreshCw} submitting={pending === `verify-${order.id}`} onClick={() => verify(order)}>
              Verifică starea
            </Button>
          </>
        ) : (
          <>
            <div className={styles.footSummary}>
              <div>
                <strong>
                  {plural(accepted.length, 'acceptată', 'acceptate')} · {plural(rejectedCount, 'respinsă', 'respinse')}
                </strong>{' '}
                · total după decizie <strong>{formatMoney(totalAfter)}</strong>
              </div>
              <div className={styles.footNote}>
                {rejectedCount === order.items.length
                  ? 'Toate pozițiile sunt respinse: la confirmare comanda se anulează.'
                  : 'Deciziile se trimit împreună. Dacă respingi toate pozițiile, comanda se anulează.'}
              </div>
            </div>
            <Button submitting={submitting} onClick={() => confirm(order)}>
              {draft.uncertain === 'checked' ? 'Confirmă din nou' : 'Confirmă deciziile'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
