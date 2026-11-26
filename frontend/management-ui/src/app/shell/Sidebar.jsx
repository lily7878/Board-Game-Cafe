import { Dices, LogOut } from 'lucide-react';
import { Link, usePath } from '../router';
import { useStaffAuth } from '../StaffAuthContext';
import { ADMIN_NAV, OPERATIONS_NAV, isActive } from '../navigation';
import styles from './Sidebar.module.css';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** 248px espresso sidebar. "Administrare" section is rendered only for MANAGER. */
export function Sidebar({ counters = {} }) {
  const path = usePath();
  const { user, isManager, logout } = useStaffAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>
          <Dices size={22} aria-hidden />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>Board Game Café</span>
          {/* <span className={styles.brandSub}>Management</span> */}
        </span>
      </div>

      <NavSection title="Operațiuni" items={OPERATIONS_NAV} path={path} counters={counters} />
      {isManager && <NavSection title="Administrare" items={ADMIN_NAV} path={path} counters={counters} />}

      <div className={styles.user}>
        <span className={styles.avatar}>{initials(user?.fullName)}</span>
        <span className={styles.userText}>
          <span className={styles.userName}>{user?.fullName}</span>
          <span className={styles.userRole}>{isManager ? 'Manager' : 'Staff'}</span>
        </span>
        <button type="button" className={styles.logout} onClick={logout} aria-label="Deconectare" title="Deconectare">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

function NavSection({ title, items, path, counters }) {
  return (
    <nav className={styles.section} aria-label={title}>
      <div className={styles.overline}>{title}</div>
      {items.map((item) => {
        const active = isActive(item, path);
        const count = item.counter ? counters[item.counter] : null;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.item} ${active ? styles.active : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={18} aria-hidden />
            {item.label}
            {count > 0 && <span className={styles.counter}>{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
