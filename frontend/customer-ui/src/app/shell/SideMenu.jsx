import { useEffect, useState } from 'react';
import { ClipboardList, Coffee, Dices, Hourglass, House, LogOut, Receipt, Store } from 'lucide-react';
import { formatLocalTime, tableLabel } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, Modal } from '../../shared/ui';
import { useParticipant } from '../ParticipantContext';
import { usePath, useNavigate } from '../router';
import styles from './Shell.module.css';

export const CUSTOMER_NAV = [
  { path: '/dashboard', label: 'Acasă', icon: House },
  { path: '/menu', label: 'Meniu', icon: Coffee },
  { path: '/games', label: 'Jocuri', icon: Dices },
  { path: '/orders', label: 'Comenzile mele', icon: ClipboardList },
  { path: '/game-requests', label: 'Cererile mele de jocuri', icon: Hourglass },
  { path: '/bill', label: 'Nota mesei', icon: Receipt },
];

/** 3c — left panel (318px). "Ieși de pe acest telefon" asks first: it cannot be undone without the PIN. */
export function SideMenu({ onClose }) {
  const { participant, leave } = useParticipant();
  const path = usePath();
  const navigate = useNavigate();
  const cafe = useApiQuery('/api/participant/cafe-info');
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !confirming) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, confirming]);

  const today = cafe.data?.openingHours?.find((h) => h.dayOfWeek === cafe.data.todayDayOfWeek);
  const hours = !today ? '' : today.closed ? 'Închis azi' : `Deschis azi ${formatLocalTime(today.openTime)}–${formatLocalTime(today.closeTime)}`;

  const go = (to) => {
    onClose();
    navigate(to);
  };

  return (
    <div className={styles.menuOverlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <nav className={styles.menuPanel} aria-label="Meniu principal">
        <div className={styles.menuUser}>
          <span className={styles.menuAvatar} aria-hidden>
            {participant?.displayName?.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{participant?.displayName}</strong>
            <span>Masa {tableLabel(participant?.tableNumber)}</span>
          </div>
        </div>

        <ul className={styles.menuList}>
          {CUSTOMER_NAV.map((item) => {
            const Icon = item.icon;
            const active = path === item.path || path.startsWith(`${item.path}/`);
            return (
              <li key={item.path}>
                <button type="button" className={`${styles.menuItem} ${active ? styles.menuItemOn : ''}`} aria-current={active ? 'page' : undefined} onClick={() => go(item.path)}>
                  <Icon size={20} aria-hidden />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className={styles.menuBottom}>
          <div className={styles.cafeInfo}>
            <Store size={20} aria-hidden />
            <div>
              <strong>{cafe.data?.cafeName ?? 'Despre cafenea'}</strong>
              {hours && <span>{hours}</span>}
            </div>
          </div>
          <button type="button" className={styles.leave} onClick={() => setConfirming(true)}>
            <LogOut size={18} aria-hidden /> Ieși de pe acest telefon
          </button>
        </div>
      </nav>

      {confirming && (
        <Modal open onClose={() => setConfirming(false)} icon={LogOut} title="Ieși de pe acest telefon?" width={360}>
          <p className={styles.modalText}>
            Comenzile tale rămân pe nota mesei. Ca să revii, ai nevoie din nou de codul QR și de PIN.
          </p>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={leaving}>
              Rămân
            </Button>
            <Button
              submitting={leaving}
              onClick={async () => {
                setLeaving(true);
                await leave();
              }}
            >
              Ies
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
