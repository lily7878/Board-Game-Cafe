import { Bell, CalendarDays } from 'lucide-react';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Skeleton } from '../../shared/ui';
import styles from './Topbar.module.css';

/**
 * 76px topbar: page title, current business day pill, notifications bell.
 * The live-connection indicator (Live / Reconectare…) is added together with the WebSocket client.
 */
export function Topbar({ title }) {
  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>
      <BusinessDayPill />
      <button type="button" className={styles.bell} aria-label="Notificări">
        <Bell size={18} />
      </button>
    </header>
  );
}

function BusinessDayPill() {
  const { data: day, loading, error } = useApiQuery('/api/admin/business-days/current');

  if (loading && !day) return <Skeleton width={150} height={40} />;
  if (error || !day) return null;

  return (
    <div className={styles.pill}>
      <CalendarDays size={16} className={styles.pillIcon} aria-hidden />
      <strong>Ziua #{day.dayNumber}</strong>
      <span className={styles.muted}>{day.status === 'OPEN' ? 'deschisă' : 'închisă'}</span>
    </div>
  );
}
