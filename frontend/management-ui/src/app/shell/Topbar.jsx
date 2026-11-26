import { CalendarDays, RotateCw } from 'lucide-react';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Skeleton } from '../../shared/ui';
import { useLive } from '../live/LiveProvider';
import { useLiveRefetch } from '../live/useLiveRefetch';
import { NotificationsBell } from './NotificationsBell';
import styles from './Topbar.module.css';

/** 76px topbar: page title, current business day, live connection state, notifications bell. */
export function Topbar({ title }) {
  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>
      <BusinessDayPill />
      {/* <LiveIndicator /> */}
      {/* <NotificationsBell /> */}
    </header>
  );
}

function BusinessDayPill() {
  const { data: day, loading, error, refetch } = useApiQuery('/api/admin/business-days/current');
  // End of Day closes day N and opens N+1 automatically.
  useLiveRefetch(refetch, ['business-day.']);

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

function LiveIndicator() {
  const { status, retry } = useLive();

  if (status === 'live') {
    return (
      <div className={`${styles.live} ${styles.liveOn}`} role="status">
        <span className={styles.liveDot} />
        Live
      </div>
    );
  }

  return (
    <div className={`${styles.live} ${styles.liveOff}`} role="status">
      <span className={`${styles.liveDot} ${styles.liveDotOff}`} />
      {status === 'connecting' ? 'Conectare…' : 'Reconectare…'}
      {status === 'reconnecting' && (
        <button type="button" className={styles.retry} onClick={retry}>
          <RotateCw size={14} aria-hidden />
          Reîncearcă
        </button>
      )}
    </div>
  );
}
