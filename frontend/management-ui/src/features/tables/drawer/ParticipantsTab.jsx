import { Info } from 'lucide-react';
import { formatMoney, formatTime, plural } from '../../../shared/format';
import { Badge } from '../../../shared/ui';
import styles from './TableDrawer.module.css';

/**
 * 2a — connected phones. Participants are NOT the number of people who pay: that is declared
 * separately on the bill (a group may share one phone).
 */
export function ParticipantsTab({ data }) {
  const { details, bill, orders } = data;
  const spentBy = new Map((bill?.participants ?? []).map((p) => [p.participantId, p.menuTotal]));
  const ordersBy = orders.reduce((acc, o) => acc.set(o.participantId, (acc.get(o.participantId) ?? 0) + 1), new Map());

  return (
    <>
      <p className={styles.infoNote}>
        <Info size={18} aria-hidden />
        Participanții sunt telefoanele conectate. Numărul de persoane pentru plată se declară separat, în nota mesei.
      </p>

      {details.participants.length === 0 && <p className={styles.muted}>Nimeni nu a intrat încă la masă.</p>}

      {details.participants.map((p) => {
        const count = ordersBy.get(p.participantId) ?? 0;
        // The bill counts only DELIVERED orders, so 0 lei is normal while orders are being prepared.
        const spent = Number(spentBy.get(p.participantId) ?? 0);
        return (
          <div key={p.participantId} className={`${styles.person} ${p.active ? '' : styles.personLeft}`}>
            <span className={styles.avatar}>{p.displayName.slice(0, 1).toUpperCase()}</span>
            <div className={styles.grow}>
              <div className={styles.personName}>{p.displayName}</div>
              <div className={styles.personMeta}>
                A intrat la {formatTime(p.joinedAt)} ·{' '}
                {count === 0 ? 'fără comenzi' : plural(count, 'comandă', 'comenzi')}
                {spent > 0 && ` · ${formatMoney(spent)} livrat`}
              </div>
            </div>
            {p.active ? <Badge tone="success">În sesiune</Badge> : <Badge tone="neutral">A ieșit</Badge>}
          </div>
        );
      })}

      <div className={styles.declared}>
        <span>Persoane declarate pentru plată</span>
        <strong>{details.persons ?? 'Nedeclarat încă'}</strong>
      </div>
    </>
  );
}
