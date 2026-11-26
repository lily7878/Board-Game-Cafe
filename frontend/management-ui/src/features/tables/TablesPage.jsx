import { useState } from 'react';
import { Armchair, RefreshCw } from 'lucide-react';
import { useLive } from '../../app/live/LiveProvider';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate, useSearchParams } from '../../app/router';
import { useStaffAuth } from '../../app/StaffAuthContext';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { useNow } from '../../shared/hooks/useNow';
import { Button, Card, EmptyMessage, Skeleton } from '../../shared/ui';
import { TableDrawer } from './drawer/TableDrawer';
import { OpenTableModal } from './OpenTableModal';
import { PaymentCheckModal } from './PaymentCheckModal';
import { TableCard } from './TableCard';
import styles from './Tables.module.css';

const FILTERS = [
  { value: 'all', label: 'Toate', dot: null, test: () => true },
  { value: 'free', label: 'Libere', dot: 'var(--status-success-dot)', test: (t) => !t.session },
  { value: 'active', label: 'Active', dot: 'var(--status-active-dot)', test: (t) => t.session?.status === 'ACTIVE' },
  { value: 'checkout', label: 'Checkout', dot: 'var(--status-warning-dot)', test: (t) => t.session?.status === 'CHECKOUT_PENDING' },
];

/**
 * 1d — tables grid. The open drawer lives in the URL (?table=ID&tab=orders), so the
 * dashboard can link straight to a table and Back closes the drawer.
 */
export function TablesPage() {
  const { data, loading, error, refetch } = useApiQuery('/api/admin/tables/overview');
  useLiveRefetch(refetch, ['session.', 'order.', 'game.', 'tables.', 'payment.']);

  const { status: liveStatus } = useLive();
  const { isManager } = useStaffAuth();
  const navigate = useNavigate();
  const params = useSearchParams();
  const now = useNow();
  const [filter, setFilter] = useState('all');
  const [opening, setOpening] = useState(null);

  if (loading && !data) return <GridSkeleton />;
  if (error && !data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Armchair} title="Nu am putut încărca mesele" action={<Button variant="secondary" onClick={refetch}>Reîncearcă</Button>}>
          {error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const tables = data.filter((t) => t.active);
  const selectedId = Number(params.get('table')) || null;
  const selected = tables.find((t) => t.tableId === selectedId && t.session);
  const tab = params.get('tab') ?? 'summary';
  // 5b: ?pay=SESSION_ID opens the payment check; it survives the session closing (table becomes free).
  const paySession = Number(params.get('pay')) || null;
  const tableUrl = selected ? `/tables?table=${selected.tableId}&tab=${tab}` : '/tables';
  const visible = tables.filter(FILTERS.find((f) => f.value === filter).test);

  const showTable = (table, nextTab = 'summary') => navigate(`/tables?table=${table.tableId}&tab=${nextTab}`);

  if (tables.length === 0) {
    return (
      <Card size="lg">
        <EmptyMessage
          icon={Armchair}
          title="Nicio masă activă"
          action={isManager && <Button onClick={() => navigate('/admin/tables')}>Configurează mesele</Button>}
        >
          {isManager ? 'Adaugă mesele cafenelei din Configurare mese.' : 'Managerul trebuie să adauge mesele cafenelei.'}
        </EmptyMessage>
      </Card>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.chips} role="radiogroup" aria-label="Filtru mese">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={filter === f.value}
              className={`${styles.chip} ${filter === f.value ? styles.chipOn : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.dot && <span className={styles.chipDot} style={{ background: f.dot }} />}
              {f.label}
              <span className={styles.chipCount}>{tables.filter(f.test).length}</span>
            </button>
          ))}
        </div>
        {/* {liveStatus === 'live' && (
          <span className={styles.liveHint}>
            <RefreshCw size={14} aria-hidden />
            Actualizat live
          </span>
        )} */}
      </div>

      {visible.length === 0 ? (
        <p className={styles.noMatch}>Nicio masă în această categorie.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((table) => (
            <TableCard
              key={table.tableId}
              table={table}
              now={now}
              selected={table.tableId === selected?.tableId}
              onOpenTable={setOpening}
              onSelect={(t) => showTable(t)}
            />
          ))}
        </div>
      )}

      {opening && (
        <OpenTableModal
          table={opening}
          onClose={() => setOpening(null)}
          onOpened={() => {
            // Show the QR right away: the customers are waiting at the table.
            const table = opening;
            setOpening(null);
            refetch();
            showTable(table, 'qr');
          }}
        />
      )}

      {selected && (
        <TableDrawer
          key={selected.session.sessionId}
          table={selected}
          tab={tab}
          onTabChange={(next) => navigate(`/tables?table=${selected.tableId}&tab=${next}`, { replace: true })}
          onClose={() => navigate('/tables')}
          onCheckPayment={() => navigate(`${tableUrl}&pay=${selected.session.sessionId}`)}
        />
      )}

      {paySession && <PaymentCheckModal sessionId={paySession} onClose={() => navigate(tableUrl, { replace: true })} />}
    </>
  );
}

function GridSkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 8 }, (_, i) => (
        <Card key={i} className={styles.card} style={{ opacity: i < 4 ? 1 : 0.6 }}>
          <Skeleton width="45%" height={18} />
          <Skeleton width="25%" height={12} tone={2} />
          <Skeleton width="100%" height={40} style={{ marginTop: 'auto' }} />
        </Card>
      ))}
    </div>
  );
}
