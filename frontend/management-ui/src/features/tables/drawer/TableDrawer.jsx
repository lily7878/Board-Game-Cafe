import { useState } from 'react';
import { Clock, QrCode, RotateCcw, SearchCheck, Users, X } from 'lucide-react';
import { apiRequest } from '../../../shared/api/http';
import { formatDuration, formatTime, plural, tableLabel } from '../../../shared/format';
import { useAction } from '../../../shared/hooks/useAction';
import { useNow } from '../../../shared/hooks/useNow';
import { Badge, Button, Drawer, Skeleton, Tabs } from '../../../shared/ui';
import { SESSION_STATUS } from '../../../shared/statuses';
import { AccessTab } from './AccessTab';
import { GamesTab } from './GamesTab';
import { OrdersTab } from './OrdersTab';
import { ParticipantsTab } from './ParticipantsTab';
import { QrFullscreen } from './QrFullscreen';
import { SummaryTab } from './SummaryTab';
import { useSessionActions } from './useSessionActions';
import { useSessionData } from './useSessionData';
import styles from './TableDrawer.module.css';

/**
 * Table drawer (1e / 2a / 2b / 2c / 1f / 2d). Tabs: Rezumat / Participanți / Comenzi / Jocuri / QR-PIN.
 * During CHECKOUT_PENDING, Rezumat becomes the checkout view and QR/PIN is hidden
 * (Core refuses to reveal access while the table is paying).
 */
export function TableDrawer({ table, tab, onTabChange, onClose, onCheckPayment }) {
  const sessionId = table.session?.sessionId;
  const data = useSessionData(sessionId);
  const now = useNow();
  const { run, pending } = useAction();
  const { actions, modals } = useSessionActions({ run, refetch: data.refetchAll });
  const [fullscreen, setFullscreen] = useState(false);

  const status = data.details?.status ?? table.session?.status;
  const checkout = status === 'CHECKOUT_PENDING';
  const activeTab = checkout && tab === 'qr' ? 'summary' : tab;

  const openOrders = data.orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  const openRequests = data.requests.filter((r) => ['REQUESTED', 'RESERVED', 'DELIVERED'].includes(r.status)).length;
  const tabs = [
    { value: 'summary', label: 'Rezumat' },
    { value: 'participants', label: 'Participanți', count: data.details?.participants.filter((p) => p.active).length },
    { value: 'orders', label: 'Comenzi', count: openOrders || null },
    { value: 'games', label: 'Jocuri', count: openRequests || null },
    ...(checkout ? [] : [{ value: 'qr', label: 'QR/PIN' }]),
  ];

  const reopen = () =>
    run('reopen', () => apiRequest(`/api/admin/sessions/${sessionId}/reopen`, { method: 'POST' }), {
      success: `Masa ${tableLabel(table.tableNumber)} a fost redeschisă.`,
      after: data.refetchAll,
    });

  const statusInfo = checkout ? { ...SESSION_STATUS.CHECKOUT_PENDING, label: 'Checkout în așteptare' } : SESSION_STATUS[status];

  const header = (
    <>
      <div className={styles.headRow}>
        <div className={styles.headText}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Masa {tableLabel(table.tableNumber)}</h2>
            {statusInfo && (
              <Badge tone={statusInfo.tone} icon={statusInfo.icon}>
                {statusInfo.label}
              </Badge>
            )}
          </div>
          <div className={styles.headMeta}>
            <span>
              <Users size={15} aria-hidden />
              {plural(table.session?.connectedParticipants ?? 0, 'conectat', 'conectați')} · {plural(table.capacity, 'loc', 'locuri')}
            </span>
            {table.session && (
              <span>
                <Clock size={15} aria-hidden />
                Deschisă la {formatTime(table.session.startedAt)} · {formatDuration(table.session.startedAt, now)}
              </span>
            )}
          </div>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Închide">
          <X size={18} />
        </button>
      </div>
      <Tabs tabs={tabs} value={activeTab} onChange={onTabChange} stretch ariaLabel="Secțiuni masă" />
    </>
  );

  const footer = checkout ? (
    <>
      <span className={styles.footNote}>Plata se face de client, din telefon.</span>
      <Button variant="ghost" iconLeft={SearchCheck} onClick={onCheckPayment}>
        Verifică plata
      </Button>
      <Button variant="secondary" iconLeft={RotateCcw} submitting={pending === 'reopen'} onClick={reopen}>
        Redeschide sesiunea
      </Button>
    </>
  ) : (
    <>
      <span className={styles.footNote}>{table.session?.openedBy ? `Deschisă de ${table.session.openedBy}` : ''}</span>
      <Button variant="secondary" iconLeft={QrCode} onClick={() => setFullscreen(true)}>
        QR/PIN fullscreen
      </Button>
    </>
  );

  return (
    <>
      <Drawer open onClose={onClose} label={`Masa ${tableLabel(table.tableNumber)}`} header={header} footer={footer}>
        {data.loading ? (
          <DrawerSkeleton />
        ) : data.error ? (
          <p className={styles.errorBox}>Nu am putut încărca sesiunea. {data.error.detail}</p>
        ) : (
          <>
            {activeTab === 'summary' && <SummaryTab data={data} checkout={checkout} actions={actions} pending={pending} />}
            {activeTab === 'participants' && <ParticipantsTab data={data} />}
            {activeTab === 'orders' && <OrdersTab data={data} actions={actions} pending={pending} />}
            {activeTab === 'games' && <GamesTab data={data} actions={actions} pending={pending} />}
            {activeTab === 'qr' && <AccessTab table={table} />}
          </>
        )}
      </Drawer>
      {modals}
      {fullscreen && <QrFullscreen table={table} onClose={() => setFullscreen(false)} />}
    </>
  );
}

function DrawerSkeleton() {
  return [1, 0.8, 0.55].map((opacity) => (
    <div key={opacity} style={{ opacity, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="85%" height={12} tone={2} />
    </div>
  ));
}
