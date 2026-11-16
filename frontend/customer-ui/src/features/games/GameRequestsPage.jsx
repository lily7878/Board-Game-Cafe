import { useState } from 'react';
import { Ban, Check, Dices, KeyRound, Sparkles } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { apiRequest } from '../../shared/api/http';
import { formatTime } from '../../shared/format';
import { useAction } from '../../shared/hooks/useAction';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Badge, Button, EmptyMessage, Skeleton } from '../../shared/ui';
import { GameIcon } from './GameIcon';
import styles from './Games.module.css';

const BADGE = {
  REQUESTED: { tone: 'warning', label: 'În așteptare', icon: Sparkles },
  RESERVED: { tone: 'reserved', label: 'Rezervat', icon: KeyRound },
  DELIVERED: { tone: 'active', label: 'Livrat' },
  RETURNED: { tone: 'neutral', label: 'Returnat' },
  REJECTED: { tone: 'neutral', label: 'Respins' },
  CANCELLED: { tone: 'neutral', label: 'Anulat' },
};
const OPEN = ['REQUESTED', 'RESERVED'];

/** 4j — this phone's game requests: badge + timeline (sent → reserved → delivered → returned). */
export function GameRequestsPage() {
  const requests = useApiQuery('/api/participant/game-requests');
  useLiveRefetch(requests.refetch, ['game.']);
  const navigate = useNavigate();
  const { run, pending } = useAction();
  const [expanded, setExpanded] = useState(null);

  const list = [...(requests.data ?? [])].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  const cancel = (r) =>
    run(`cancel-${r.id}`, () => apiRequest(`/api/participant/game-requests/${r.id}/cancel`, { method: 'POST' }), {
      success: `Cererea pentru ${r.gameTitle} a fost anulată.`,
      after: requests.refetch,
    });

  return (
    <MobileShell title="Cererile mele">
      {requests.loading && !requests.data ? (
        <Skeleton width="100%" height={160} />
      ) : list.length === 0 ? (
        <EmptyMessage icon={Dices} title="Nicio cerere de joc" action={<Button onClick={() => navigate('/games')}>Vezi jocurile</Button>}>
          Alege un joc din catalog și personalul îl aduce la masă.
        </EmptyMessage>
      ) : (
        list.map((r) => {
          const badge = BADGE[r.status];
          const open = expanded == null ? OPEN.includes(r.status) : expanded === r.id;
          const sub =
            r.status === 'DELIVERED'
              ? `la masă din ${formatTime(r.deliveredAt)}`
              : r.status === 'REJECTED'
                ? `Respins: ${r.resolutionReason ?? 'fără motiv'}`
                : r.status === 'RETURNED'
                  ? `returnat la ${formatTime(r.returnedAt)}`
                  : `cerut la ${formatTime(r.requestedAt)}`;
          return (
            <article key={r.id} className={styles.requestCard}>
              <button type="button" className={styles.requestHead} aria-expanded={open} onClick={() => setExpanded(open ? -1 : r.id)}>
                <span className={`${styles.icon} ${r.status === 'REJECTED' || r.status === 'CANCELLED' ? styles.iconMuted : ''}`} aria-hidden>
                  <GameIcon id={r.gameId} size={24} />
                </span>
                <span className={styles.requestText}>
                  <strong>{r.gameTitle}</strong>
                  <span>{sub}</span>
                </span>
                <Badge tone={badge.tone} icon={badge.icon}>
                  {badge.label}
                </Badge>
              </button>

              {open && r.status !== 'CANCELLED' && (
                <ol className={styles.timeline}>
                  <Step done at={r.requestedAt} label="Cerere trimisă" />
                  {r.status === 'REJECTED' ? (
                    <Step rejected label="Respins" note={r.resolutionReason} />
                  ) : (
                    <>
                      <Step done={Boolean(r.reservedAt)} current={r.status === 'RESERVED'} at={r.reservedAt} label="Rezervat pentru voi" note={r.status === 'RESERVED' ? 'personalul îl aduce' : null} />
                      <Step done={Boolean(r.deliveredAt)} current={r.status === 'DELIVERED'} at={r.deliveredAt} label="Livrat la masă" />
                      <Step done={Boolean(r.returnedAt)} at={r.returnedAt} label="Returnat" />
                    </>
                  )}
                </ol>
              )}
              {open && OPEN.includes(r.status) && (
                <Button variant="secondary" size="sm" submitting={pending === `cancel-${r.id}`} onClick={() => cancel(r)}>
                  Anulează cererea
                </Button>
              )}
            </article>
          );
        })
      )}
    </MobileShell>
  );
}

function Step({ done, current, rejected, at, label, note }) {
  return (
    <li className={`${styles.step} ${done ? styles.stepDone : ''} ${current ? styles.stepCurrent : ''} ${rejected ? styles.stepRejected : ''}`}>
      <span className={styles.stepDot} aria-hidden>
        {done && !current && <Check size={13} />}
        {rejected && <Ban size={13} />}
      </span>
      <span>
        <strong>{label}</strong>
        {(at || note) && (
          <span>
            {at ? formatTime(at) : ''}
            {at && note ? ' · ' : ''}
            {note}
          </span>
        )}
      </span>
    </li>
  );
}
