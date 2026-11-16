import { useState } from 'react';
import { ArrowLeft, Menu, WifiOff } from 'lucide-react';
import { useLive } from '../live/LiveProvider';
import { useParticipant } from '../ParticipantContext';
import { useNavigate } from '../router';
import { SideMenu } from './SideMenu';
import styles from './Shell.module.css';

/**
 * Mobile page frame: header (hamburger or back · centered title · avatar), the 6c banner when live
 * updates are off, and the page. `back` = path of the parent screen (shows ← instead of ☰).
 * `footer` is rendered fixed at the bottom (e.g. the cart bar on the menu).
 */
export function MobileShell({ title, back, footer, children }) {
  const { participant } = useParticipant();
  const { status, retry } = useLive();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        {back ? (
          <button type="button" className={styles.round} onClick={() => navigate(back)} aria-label="Înapoi">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <button type="button" className={styles.round} onClick={() => setMenuOpen(true)} aria-label="Deschide meniul" aria-expanded={menuOpen}>
            <Menu size={20} />
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.avatar} aria-hidden>
          {participant?.displayName?.slice(0, 1).toUpperCase()}
        </span>
      </header>

      {status === 'reconnecting' && (
        <div className={styles.liveBanner} role="status">
          <WifiOff size={18} aria-hidden />
          <span>Actualizările live sunt oprite</span>
          <button type="button" onClick={retry}>
            Reîncearcă
          </button>
        </div>
      )}

      <main className={`${styles.page} ${footer ? styles.pageWithFooter : ''}`}>{children}</main>
      {footer && <div className={styles.footer}>{footer}</div>}

      {menuOpen && <SideMenu onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
