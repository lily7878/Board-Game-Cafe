import {
  Armchair,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock,
  Dices,
  Lock,
  LockOpen,
  Receipt,
  Settings,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { useNavigate } from '../../app/router';
import { useStaffAuth } from '../../app/StaffAuthContext';
import { cafeDayOfWeek, formatAgo, formatLocalTime, formatMoney, formatTime, plural, tableLabel } from '../../shared/format';
import { useNow } from '../../shared/hooks/useNow';
import { Badge, Button, Card, Skeleton } from '../../shared/ui';
import {
  blockedCheckouts,
  itemsSummary,
  recentActivity,
  summarizeOrders,
  summarizeRequests,
  summarizeTables,
} from './dashboardModel';
import { useDashboardData } from './useDashboardData';
import styles from './Dashboard.module.css';

/** 1b (Staff) / 1c (Manager). Same KPIs; the manager swaps the orders list for the day card. */
export function DashboardPage() {
  const { isManager } = useStaffAuth();
  const data = useDashboardData({ isManager });
  const now = useNow();

  if (data.loading) return <DashboardSkeleton />;
  if (data.error && !data.overview) return <LoadError error={data.error} onRetry={data.retry} />;

  const tables = summarizeTables(data.overview);
  const orders = summarizeOrders(data.orders);
  const requests = summarizeRequests(data.requests);
  const activity = recentActivity(data);

  return (
    <>
      <CheckoutAlerts alerts={blockedCheckouts(tables.checkout)} />
      <KpiRow tables={tables} orders={orders} requests={requests} now={now} />

      <div className={styles.main}>
        <div className={styles.column}>
          {isManager ? (
            <>
              <CurrentDayCard day={data.day} preview={data.preview} hours={data.hours} />
              <ModuleGrid tables={tables} orders={orders} requests={requests} withAdmin />
            </>
          ) : (
            <>
              <ModuleGrid tables={tables} orders={orders} requests={requests} />
              <NewOrdersCard orders={orders.fresh} now={now} />
            </>
          )}
        </div>
        <ActivityCard entries={activity} />
      </div>
    </>
  );
}

/* ---------- alert band ---------- */

function CheckoutAlerts({ alerts }) {
  const navigate = useNavigate();
  return alerts.map((alert) => (
    <div key={alert.tableId} className={styles.alert} role="alert">
      <TriangleAlert size={20} aria-hidden />
      <p className={styles.alertText}>
        <strong>Masa {tableLabel(alert.tableNumber)} este în checkout.</strong> Plata e blocată până se rezolvă:{' '}
        {alert.reasons.join(', ')}.
      </p>
      <button type="button" className={styles.alertAction} onClick={() => navigate(`/tables?table=${alert.tableId}`)}>
        Deschide masa
        <ChevronRight size={16} aria-hidden />
      </button>
    </div>
  ));
}

/* ---------- KPIs ---------- */

function KpiRow({ tables, orders, requests, now }) {
  const oldest = orders.fresh[0];
  const checkoutNames = tables.checkout.map((t) => `Masa ${tableLabel(t.tableNumber)}`).join(', ');
  return (
    <div className={styles.kpis}>
      <Kpi label="Mese active" icon={Armchair} value={tables.occupied} suffix={`/ ${tables.total}`}>
        {plural(tables.free, 'liberă', 'libere')}
      </Kpi>
      <Kpi label="Comenzi noi" icon={ClipboardList} value={orders.fresh.length}>
        {oldest ? `cea mai veche ${formatAgo(oldest.placedAt, now)}` : 'nicio comandă în așteptare'}
      </Kpi>
      <Kpi label="Cereri jocuri" icon={Dices} value={requests.waiting + requests.reserved}>
        {requests.waiting} în așteptare · {plural(requests.reserved, 'rezervată', 'rezervate')}
      </Kpi>
      <Kpi label="Sesiuni în checkout" icon={Receipt} tone="warning" value={tables.checkout.length}>
        {checkoutNames || 'niciuna'}
      </Kpi>
    </div>
  );
}

function Kpi({ label, icon: Icon, tone = 'rose', value, suffix, children }) {
  return (
    <Card className={styles.kpi}>
      <div className={styles.kpiHead}>
        <span className={styles.kpiLabel}>{label}</span>
        <span className={`${styles.kpiIcon} ${styles[tone]}`}>
          <Icon size={18} aria-hidden />
        </span>
      </div>
      <div className={styles.kpiValue}>
        {value}
        {suffix && <span className={styles.kpiSuffix}>{suffix}</span>}
      </div>
      <div className={styles.kpiSub}>{children}</div>
    </Card>
  );
}

/* ---------- module shortcuts ---------- */

function ModuleGrid({ tables, orders, requests, withAdmin = false }) {
  const navigate = useNavigate();
  const modules = [
    { to: '/tables', label: 'Mese', icon: Armchair, sub: `${plural(tables.occupied, 'activă', 'active')} · ${plural(tables.free, 'liberă', 'libere')}` },
    { to: '/orders', label: 'Comenzi', icon: ClipboardList, sub: `${plural(orders.fresh.length, 'nouă', 'noi')} · ${orders.inProgress} în preparare` },
    {
      to: '/game-requests',
      label: 'Cereri jocuri',
      icon: Dices,
      sub: withAdmin ? `${requests.waiting} în așteptare` : `${requests.waiting} în așteptare · ${plural(requests.reserved, 'rezervată', 'rezervate')}`,
    },
  ];

  return (
    <div className={`${styles.modules} ${withAdmin ? styles.modules4 : ''}`}>
      {modules.map((m) => (
        <Card key={m.to} interactive className={styles.module} onClick={() => navigate(m.to)}>
          <div className={styles.moduleHead}>
            <span className={styles.moduleIcon}>
              <m.icon size={22} aria-hidden />
            </span>
            {!withAdmin && <ChevronRight size={18} className={styles.chevron} aria-hidden />}
          </div>
          <div>
            <div className={styles.moduleTitle}>{m.label}</div>
            <div className={styles.moduleSub}>{m.sub}</div>
          </div>
        </Card>
      ))}
      {withAdmin && (
        <button type="button" className={`${styles.module} ${styles.adminModule}`} onClick={() => navigate('/admin')}>
          <span className={`${styles.moduleIcon} ${styles.adminIcon}`}>
            <Settings size={20} aria-hidden />
          </span>
          <div>
            <div className={styles.moduleTitle}>Administrare</div>
            <div className={styles.adminSub}>Personal, jocuri, meniu, setări</div>
          </div>
        </button>
      )}
    </div>
  );
}

/* ---------- staff: new orders ---------- */

function NewOrdersCard({ orders, now }) {
  const navigate = useNavigate();
  return (
    <Card className={styles.listCard}>
      <div className={styles.listHead}>
        <h2 className={styles.cardTitle}>Comenzi noi</h2>
        <button type="button" className={styles.link} onClick={() => navigate('/orders')}>
          Toate comenzile
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
      {orders.length === 0 ? (
        <p className={styles.emptyRow}>Nicio comandă nouă. Comenzile trimise de clienți apar aici.</p>
      ) : (
        orders.slice(0, 5).map((order) => (
          <div key={order.id} className={styles.row}>
            <span className={styles.tableBadge}>{tableLabel(order.tableNumber)}</span>
            <div className={styles.rowText}>
              <div className={styles.rowTitle}>
                Masa {tableLabel(order.tableNumber)} · #C-{order.id}
              </div>
              <div className={styles.rowSub}>{itemsSummary(order)}</div>
            </div>
            <span className={styles.age}>
              <Clock size={14} aria-hidden />
              {formatAgo(order.placedAt, now).replace('acum ', '')}
            </span>
            <Button size="sm" onClick={() => navigate('/orders')}>
              Procesează
            </Button>
          </div>
        ))
      )}
    </Card>
  );
}

/* ---------- manager: current day + End of Day ---------- */

function CurrentDayCard({ day, preview, hours }) {
  const navigate = useNavigate();
  if (!preview || !day) {
    return (
      <div className={styles.dayCard}>
        <Skeleton width={180} height={34} tone={2} />
      </div>
    );
  }

  const today = hours?.find((h) => h.dayOfWeek === cafeDayOfWeek());
  const schedule = !today ? '' : today.closed ? ' · Închis azi' : ` · Program ${formatLocalTime(today.openTime)}–${formatLocalTime(today.closeTime)}`;
  const origin = preview.dayNumber > 1 ? `Deschisă automat după EOD-ul zilei #${preview.dayNumber - 1}` : 'Prima zi de lucru';
  const open = preview.openSessions;

  return (
    <section className={styles.dayCard} aria-label="Ziua curentă">
      <span className={styles.dayDeco} aria-hidden />
      <div className={styles.dayHead}>
        <div>
          <div className={styles.dayOverline}>Ziua curentă</div>
          <div className={styles.dayTitle}>Ziua #{preview.dayNumber}</div>
          <div className={styles.daySub}>
            {origin}
            {schedule}
          </div>
        </div>
        <button type="button" className={styles.dayLink} onClick={() => navigate('/admin/reports')}>
          <TrendingUp size={16} aria-hidden />
          Rapoarte
        </button>
      </div>

      <div className={styles.dayStats}>
        <DayStat label="Sesiuni închise" value={preview.figures.closedSessions} />
        <DayStat label="Sesiuni deschise" value={open} />
        <DayStat label="Încasat (sesiuni închise)" value={formatMoney(preview.figures.totalRevenue)} />
      </div>

      <div className={styles.eod}>
        <span className={styles.eodIcon}>{preview.canFinalize ? <LockOpen size={18} /> : <Lock size={18} />}</span>
        <div className={styles.eodText}>
          <div className={styles.eodTitle}>{preview.canFinalize ? 'End of Day disponibil' : 'End of Day indisponibil'}</div>
          <div className={styles.eodSub}>
            {preview.canFinalize
              ? `Toate sesiunile sunt închise. Ziua #${preview.dayNumber + 1} se deschide automat.`
              : `Toate sesiunile trebuie închise. ${open === 1 ? 'Mai este 1 deschisă.' : `Mai sunt ${open} deschise.`}`}
          </div>
        </div>
        <Button size="sm" disabled={!preview.canFinalize} onClick={() => navigate('/admin/reports')}>
          Finalizează ziua
        </Button>
      </div>
    </section>
  );
}

function DayStat({ label, value }) {
  return (
    <div className={styles.dayStat}>
      <div className={styles.dayStatLabel}>{label}</div>
      <div className={styles.dayStatValue}>{value}</div>
    </div>
  );
}

/* ---------- activity ---------- */

function ActivityCard({ entries }) {
  return (
    <Card className={styles.listCard}>
      <div className={styles.listHead}>
        <h2 className={styles.cardTitle}>Activitate recentă</h2>
        <span className={styles.hint}>din starea curentă</span>
      </div>
      {entries.length === 0 ? (
        <p className={styles.emptyRow}>Încă nu s-a întâmplat nimic azi.</p>
      ) : (
        entries.map((entry) => (
          <div key={entry.key} className={styles.row}>
            <span className={styles.time}>{formatTime(entry.at)}</span>
            <div className={styles.rowText}>
              <div className={styles.rowTitle}>{entry.title}</div>
              {entry.detail && <div className={styles.rowSub}>{entry.detail}</div>}
            </div>
            <Badge tone={entry.status.tone} icon={entry.status.icon}>
              {entry.status.label}
            </Badge>
          </div>
        ))
      )}
    </Card>
  );
}

/* ---------- LOADING / ERROR ---------- */

function DashboardSkeleton() {
  return (
    <>
      <div className={styles.kpis}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className={styles.kpi}>
            <Skeleton width="55%" />
            <Skeleton width={60} height={36} />
            <Skeleton width="40%" height={12} tone={2} />
          </Card>
        ))}
      </div>
      <div className={styles.main}>
        <Card className={styles.listCard}>
          {[1, 0.8, 0.55].map((opacity) => (
            <div key={opacity} className={styles.row} style={{ opacity }}>
              <Skeleton width={44} height={44} />
              <div className={styles.rowText}>
                <Skeleton width="50%" />
                <Skeleton width="70%" height={12} tone={2} style={{ marginTop: 8 }} />
              </div>
            </div>
          ))}
        </Card>
        <Card className={styles.listCard}>
          <Skeleton width="40%" />
        </Card>
      </div>
    </>
  );
}

function LoadError({ error, onRetry }) {
  return (
    <Card size="lg" className={styles.error} role="alert">
      <CircleAlert size={22} aria-hidden />
      <div className={styles.rowText}>
        <div className={styles.rowTitle}>Nu am putut încărca dashboard-ul</div>
        <div className={styles.rowSub}>{error.detail ?? 'Verifică conexiunea și încearcă din nou.'}</div>
      </div>
      <Button variant="secondary" onClick={onRetry}>
        Reîncearcă
      </Button>
    </Card>
  );
}
