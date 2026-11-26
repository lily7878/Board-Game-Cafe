import { useState } from 'react';
import { CircleCheck, Download, Flag, Receipt, TrendingUp, X } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate } from '../../app/router';
import { apiRequest } from '../../shared/api/http';
import { formatDuration, formatMoney, plural, tableLabel } from '../../shared/format';
import { useAction } from '../../shared/hooks/useAction';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { useNow } from '../../shared/hooks/useNow';
import { Badge, Button, Card, EmptyMessage, Skeleton } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { FinalizeDayModal } from './FinalizeDayModal';
import { RevenueChart } from './RevenueChart';
import styles from './Reports.module.css';

/**
 * 2q / 5c / 5d — Rapoarte și End of Day.
 * End of Day is allowed only when every session of the day is closed; while it is blocked the
 * card lists the open tables with a shortcut to each one.
 */
export function ReportsPage() {
  const preview = useApiQuery('/api/admin/business-days/current/preview');
  const reports = useApiQuery('/api/admin/reports');
  const tables = useApiQuery('/api/admin/tables/overview');
  useLiveRefetch(preview.refetch, ['session.', 'payment.', 'business-day.']);
  useLiveRefetch(tables.refetch, ['session.', 'payment.']);
  useLiveRefetch(reports.refetch, ['business-day.']);

  const [confirming, setConfirming] = useState(false);
  const refetchAll = () => {
    preview.refetch();
    reports.refetch();
    tables.refetch();
  };

  if (preview.loading && !preview.data) {
    return (
      <div className={styles.top}>
        <Card size="lg" className={styles.dayCard}>
          <Skeleton width="30%" height={14} />
          <Skeleton width="45%" height={36} />
        </Card>
        <Card size="lg" className={styles.sideCard}>
          <Skeleton width="100%" height={180} tone={2} />
        </Card>
      </div>
    );
  }
  if (preview.error && !preview.data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={TrendingUp} title="Nu am putut încărca ziua curentă" action={<Button variant="secondary" onClick={preview.refetch}>Reîncearcă</Button>}>
          {preview.error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const day = preview.data;
  const history = [...(reports.data ?? [])].sort((a, b) => b.dayNumber - a.dayNumber);
  const bars = [
    ...history
      .slice(0, 6)
      .reverse()
      .map((d) => ({ key: d.businessDayId, label: `Ziua #${d.dayNumber}`, short: `#${d.dayNumber}`, value: Number(d.totalRevenue) })),
    { key: 'current', label: `Ziua #${day.dayNumber}`, short: `#${day.dayNumber}`, value: Number(day.figures.totalRevenue), preliminary: true },
  ];

  return (
    <>
      <div className={styles.top}>
        {day.canFinalize ? <ReadyCard day={day} onFinalize={() => setConfirming(true)} /> : <BlockedCard day={day} tables={tables.data ?? []} />}
        {day.canFinalize ? (
          <Card size="lg" className={styles.sideCard}>
            <div className={styles.sideHead}>
              <h2 className={styles.sideTitle}>Venit pe zile</h2>
              <span className={admin.small}>ultimele {plural(bars.length, 'zi simulată', 'zile simulate')}</span>
            </div>
            <RevenueChart bars={bars} />
            <p className={admin.small}>Ziua #{day.dayNumber} este preliminară până la finalizare.</p>
          </Card>
        ) : (
          <Card size="lg" className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Ce face Butonul Finalizează Ziua</h2>
            <ol className={styles.steps}>
              <li>Salvează raportul complet al zilei, cu produsele și jocurile.</li>
              <li>Marchează ziua ca finalizată.</li>
              <li>Deschide automat Ziua #{day.dayNumber + 1}.</li>
            </ol>
          </Card>
        )}
      </div>

      <HistoryTable reports={reports} history={history} />

      {confirming && <FinalizeDayModal preview={day} onClose={() => setConfirming(false)} onDone={refetchAll} />}
    </>
  );
}

function ReadyCard({ day, onFinalize }) {
  const { closedSessions, totalRevenue } = day.figures;
  return (
    <section className={`${styles.dayCard} ${styles.dayCardReady}`}>
      <span className={styles.overline}>Ziua curentă</span>
      <h2 className={styles.dayTitle}>Ziua #{day.dayNumber}</h2>
      <p className={styles.daySub}>
        {plural(closedSessions, 'sesiune', 'sesiuni')} · venit {formatMoney(totalRevenue)}
      </p>
      <ul className={styles.checks}>
        <li>
          <CircleCheck size={22} aria-hidden />
          {closedSessions === 0 ? 'Nicio sesiune deschisă' : closedSessions === 1 ? 'Singura sesiune e închisă' : `Toate cele ${plural(closedSessions, 'sesiune', 'sesiuni')} sunt închise`}
        </li>
        <li>
          <CircleCheck size={22} aria-hidden />
          Ziua nu a fost finalizată încă
        </li>
      </ul>
      <div className={styles.finalizeRow}>
        <button type="button" className={styles.finalizeButton} onClick={onFinalize}>
          <Flag size={18} aria-hidden /> Finalizează Ziua #{day.dayNumber}
        </button>
        <span>O singură dată pe zi. Se salvează raportul complet și se deschide automat Ziua #{day.dayNumber + 1}.</span>
      </div>
    </section>
  );
}

function BlockedCard({ day, tables }) {
  const navigate = useNavigate();
  const now = useNow();
  const open = tables.filter((t) => t.session).sort((a, b) => a.tableNumber - b.tableNumber);
  return (
    <Card size="lg" className={styles.dayCard}>
      <span className={`${styles.overline} ${styles.overlineRose}`}>Ziua curentă</span>
      <h2 className={styles.dayTitle}>Ziua #{day.dayNumber}</h2>
      <p className={styles.daySubDark}>
        {plural(day.figures.closedSessions, 'sesiune închisă', 'sesiuni închise')} · {day.openSessions === 1 ? '1 încă deschisă' : `${day.openSessions} încă deschise`}
      </p>
      <div className={styles.openList}>
        {open.map((t) => {
          const checkout = t.session.status === 'CHECKOUT_PENDING';
          return (
            <div key={t.tableId} className={`${styles.openRow} ${checkout ? styles.openRowCheckout : ''}`}>
              <span className={styles.openIcon} aria-hidden>
                {checkout ? <Receipt size={13} /> : <X size={13} />}
              </span>
              <span className={styles.grow}>
                Masa {tableLabel(t.tableNumber)} · {checkout ? 'checkout în așteptare' : `activă · ${formatDuration(t.session.startedAt, now)}`}
              </span>
              <button type="button" className={styles.openButton} onClick={() => navigate(`/tables?table=${t.tableId}`)}>
                Deschide
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.finalizeRow}>
        <Button locked>Finalizează Ziua #{day.dayNumber}</Button>
        <span className={admin.small}>Disponibil când toate sesiunile sunt închise.</span>
      </div>
    </Card>
  );
}

function HistoryTable({ reports, history }) {
  const { run, pending } = useAction();

  const download = (d) =>
    run(`pdf-${d.businessDayId}`, async () => {
      const blob = await apiRequest(`/api/admin/reports/${d.businessDayId}/pdf`, { responseType: 'blob', timeoutMs: 30000 });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raport-ziua-${d.dayNumber}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  if (reports.loading && !reports.data) return null;
  return (
    <div className={admin.tableCard}>
      {history.length === 0 ? (
        <p className={styles.emptyHistory}>Nicio zi finalizată încă. După primul End of Day, raportul apare aici, cu export PDF.</p>
      ) : (
        <table className={admin.table}>
          <thead>
            <tr>
              <th>Zi</th>
              <th>Venit total</th>
              <th>Produse</th>
              <th>Acces mese</th>
              <th>Sesiuni</th>
              <th>Stare</th>
              <th className={admin.actionsCell}>
                <span hidden>PDF</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((d) => (
              <tr key={d.businessDayId}>
                <td className={admin.strong}>Ziua #{d.dayNumber}</td>
                <td className={admin.strong}>{formatMoney(d.totalRevenue)}</td>
                <td>{formatMoney(d.menuRevenue)}</td>
                <td>{formatMoney(d.accessFeeRevenue)}</td>
                <td>{d.closedSessions}</td>
                <td>
                  <Badge tone="success">Finalizată</Badge>
                </td>
                <td className={admin.actionsCell}>
                  <Button size="sm" variant="secondary" iconLeft={Download} submitting={pending === `pdf-${d.businessDayId}`} onClick={() => download(d)}>
                    PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
