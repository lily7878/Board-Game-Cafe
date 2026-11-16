import { useEffect, useRef, useState } from 'react';
import { Bell, ClipboardList, CreditCard, Dices, Receipt, CircleCheck, Wifi } from 'lucide-react';
import { tableLabel, formatAgo } from '../../shared/format';
import { useNow } from '../../shared/hooks/useNow';
import { useNotifications } from '../notifications/NotificationsProvider';
import { useNavigate } from '../router';
import styles from './Notifications.module.css';

const ICONS = {
  order: { icon: ClipboardList, tone: styles.toneRose },
  game: { icon: Dices, tone: styles.toneWarning },
  checkout: { icon: Receipt, tone: styles.toneWarning },
  payment: { icon: CreditCard, tone: styles.toneError },
  paid: { icon: CircleCheck, tone: styles.toneSuccess },
  live: { icon: Wifi, tone: styles.toneSuccess },
};

/** Bell with the unread counter and the 420px popover (2f). */
export function NotificationsBell() {
  const { items, unread, tableNumber, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (n) => {
    markRead(n.id);
    if (n.href) {
      setOpen(false);
      navigate(n.href);
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.bell}
        aria-label={unread ? `Notificări, ${unread} necitite` : 'Notificări'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} />
        {unread > 0 && <span className={styles.counter}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Notificări">
          <div className={styles.head}>
            <h2>Notificări</h2>
            {unread > 0 && (
              <button type="button" className={styles.markAll} onClick={markAllRead}>
                Marchează citite
              </button>
            )}
          </div>
          <div className={styles.list}>
            {items.length === 0 && <p className={styles.empty}>Nimic nou deocamdată. Comenzile, cererile de jocuri și plățile apar aici pe măsură ce se întâmplă.</p>}
            {items.map((n) => {
              const { icon: Icon, tone } = ICONS[n.kind];
              const number = n.tableId ? tableNumber(n.tableId) : null;
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`${styles.item} ${n.read ? '' : styles.unread} ${n.href ? '' : styles.static}`}
                  onClick={() => choose(n)}
                >
                  <span className={`${styles.icon} ${tone}`} aria-hidden>
                    <Icon size={18} />
                  </span>
                  <span className={styles.text}>
                    <strong>
                      {n.title}
                      {number != null && ` — Masa ${tableLabel(number)}`}
                    </strong>
                    <span>
                      {formatAgo(n.at, now)}
                      {n.detail && ` · ${n.detail}`}
                    </span>
                  </span>
                  {!n.read && <span className={styles.dot} aria-label="necitită" />}
                </button>
              );
            })}
          </div>
          <p className={styles.foot}>Notificările din această sesiune de lucru, calculate din evenimentele live. Nu sunt un istoric salvat.</p>
        </div>
      )}
    </div>
  );
}
