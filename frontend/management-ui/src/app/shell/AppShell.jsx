import { TimerOff } from 'lucide-react';
import { Button, Modal } from '../../shared/ui';
import { useStaffAuth } from '../StaffAuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppShell.module.css';

/** Authenticated layout: sidebar + (topbar, scrollable page). Hosts the 7f expiry modal. */
export function AppShell({ title, children }) {
  const { status, logout } = useStaffAuth();

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar title={title} />
        <main className={styles.content}>{children}</main>
      </div>

      <Modal
        open={status === 'expired'}
        blocking
        icon={TimerOff}
        title="Sesiunea ta a expirat"
        width={440}
        actions={
          <Button size="lg" fullWidth onClick={logout}>
            Autentifică-te din nou
          </Button>
        }
      >
        Din motive de securitate, te deconectăm după 60 de minute. Autentifică-te din nou ca să continui.
      </Modal>
    </div>
  );
}
