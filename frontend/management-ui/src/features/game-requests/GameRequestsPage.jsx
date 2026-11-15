import { useState } from 'react';
import { Dices, HandPlatter, KeyRound, RefreshCw, Sparkles, Undo2 } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { apiRequest } from '../../shared/api/http';
import { formatTime, tableLabel } from '../../shared/format';
import { useAction } from '../../shared/hooks/useAction';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Badge, Button, Card, EmptyMessage, Skeleton } from '../../shared/ui';
import { useSessionActions } from '../tables/drawer/useSessionActions';
import styles from './GameRequests.module.css';

const FINISHED = 'RETURNED,REJECTED,CANCELLED';

/**
 * 2i — game requests board: În așteptare → Rezervate → La mese → Încheiate azi.
 * Each step is its own button (Rezervă, Livrează, Returnat); reject and return open the same
 * modals as the table drawer (reason / copy condition).
 */
export function GameRequestsPage() {
  // Without a filter Core returns everything still open (REQUESTED, RESERVED, DELIVERED), oldest first.
  const board = useApiQuery('/api/admin/game-requests');
  const currentDay = useApiQuery('/api/admin/business-days/current');
  const settings = useApiQuery('/api/admin/settings');
  const dayId = currentDay.data?.id;
  const finished = useApiQuery(dayId ? `/api/admin/game-requests?status=${FINISHED}&businessDayId=${dayId}` : null);

  useLiveRefetch(board.refetch, ['game.', 'session.']);
  useLiveRefetch(finished.refetch, ['game.']);
  useLiveRefetch(currentDay.refetch, ['business-day.']);
  useLiveRefetch(settings.refetch, ['settings.']);

  const refetch = () => {
    board.refetch();
    finished.refetch();
  };
  const { run, pending } = useAction();
  const { actions, modals } = useSessionActions({ run, refetch });

  // 7e: a reserve that loses the race for the last copy is explained on the card itself.
  const [conflicts, setConflicts] = useState({});
  const reserve = (request) => {
    setConflicts((all) => ({ ...all, [request.id]: false }));
    return run(`game-${request.id}`, () => apiRequest(`/api/admin/game-requests/${request.id}/reserve`, { method: 'POST' }), {
      success: `${request.gameTitle}: exemplar rezervat.`,
      after: refetch,
      onError: (error) => {
        if (!error.isConflict || !/no usable copy/i.test(error.detail ?? '')) return false;
        setConflicts((all) => ({ ...all, [request.id]: true }));
        return true;
      },
    });
  };

  if (board.loading && !board.data) return <BoardSkeleton />;
  if (board.error && !board.data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Dices} title="Nu am putut încărca cererile" action={<Button variant="secondary" onClick={board.refetch}>Reîncearcă</Button>}>
          {board.error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const requests = board.data;
  const byStatus = (status) => requests.filter((r) => r.status === status);
  const maxGames = settings.data?.maxDeliveredGamesPerTable ?? null;
  const gamesAt = (sessionId) => requests.filter((r) => r.sessionId === sessionId && r.status === 'DELIVERED').length;
  const done = [...(finished.data ?? [])].sort((a, b) => new Date(finishedAt(b)) - new Date(finishedAt(a)));

  const waiting = byStatus('REQUESTED');
  const reserved = byStatus('RESERVED');
  const atTables = byStatus('DELIVERED');

  return (
    <>
      <div className={styles.board}>
        <Column title="În așteptare" dot="var(--status-warning-dot)" count={waiting.length} empty="Nicio cerere nouă">
          {waiting.map((r) => (
            <PendingCard
              key={r.id}
              request={r}
              conflict={conflicts[r.id]}
              games={gamesAt(r.sessionId)}
              maxGames={maxGames}
              busy={pending === `game-${r.id}`}
              onReserve={() => reserve(r)}
              onReject={() => actions.askReject(r)}
            />
          ))}
        </Column>

        <Column title="Rezervate" dot="var(--status-reserved-dot)" count={reserved.length} empty="Nicio rezervare">
          {reserved.map((r) => {
            const full = maxGames != null && gamesAt(r.sessionId) >= maxGames;
            return (
              <article key={r.id} className={styles.card}>
                <CardHead request={r} icon={KeyRound} tone="reserved" sub={`rezervat ${formatTime(r.reservedAt)}`} />
                <p className={styles.note}>Exemplar {r.copyInventoryCode ?? ''} pregătit la bar</p>
                {full && (
                  <p className={styles.warn}>
                    Masa are deja {gamesAt(r.sessionId)}/{maxGames} jocuri. Livrează după ce returnează unul.
                  </p>
                )}
                <Button
                  size="sm"
                  fullWidth
                  iconLeft={HandPlatter}
                  locked={full}
                  submitting={pending === `game-${r.id}`}
                  onClick={() => actions.deliver(r)}
                >
                  Livrează la masă
                </Button>
              </article>
            );
          })}
        </Column>

        <Column
          title="La mese"
          dot="var(--status-active-dot)"
          count={atTables.length}
          empty="Niciun joc la mese"
          footer={
            atTables.length > 0 && (
              <span className={styles.legend}>
                <Undo2 size={13} aria-hidden /> Marchează returnat
              </span>
            )
          }
        >
          {atTables.map((r) => (
            <article key={r.id} className={`${styles.card} ${styles.cardRow}`}>
              <CardHead request={r} icon={Dices} tone="active" sub={`din ${formatTime(r.deliveredAt)}`} copy />
              <button
                type="button"
                className={styles.returnButton}
                onClick={() => actions.askReturn(r)}
                disabled={pending === `game-${r.id}`}
                aria-label={`Marchează returnat: ${r.gameTitle}, masa ${tableLabel(r.tableNumber)}`}
                title="Marchează returnat"
              >
                <Undo2 size={15} />
              </button>
            </article>
          ))}
        </Column>

        <Column title="Încheiate azi" dot="var(--status-neutral-dot)" count={done.length} empty="Nimic încheiat încă" muted>
          {done.length > 0 && (
            <div className={styles.doneList}>
              {done.map((r) => (
                <div key={r.id} className={styles.doneRow}>
                  <div className={styles.grow}>
                    <div className={styles.doneTitle}>{r.gameTitle}</div>
                    <div className={styles.doneMeta}>
                      Masa {tableLabel(r.tableNumber)} · {formatTime(finishedAt(r))}
                      {r.resolutionReason && ` · ${r.resolutionReason}`}
                    </div>
                  </div>
                  {finishedBadge(r)}
                </div>
              ))}
            </div>
          )}
        </Column>
      </div>
      {modals}
    </>
  );
}

/** Rejections carry no timestamp of their own, so they fall back to the request time. */
const finishedAt = (r) => r.returnedAt ?? r.cancelledAt ?? r.requestedAt;

function finishedBadge(r) {
  if (r.status === 'RETURNED') return <Badge tone="neutral">Returnat</Badge>;
  if (r.status === 'REJECTED') return <Badge tone="active">Respins</Badge>;
  return <Badge tone="neutral">Anulat</Badge>;
}

function Column({ title, dot, count, empty, muted, footer, children }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className={styles.column} aria-label={title}>
      <h2 className={`${styles.columnTitle} ${muted ? styles.columnMuted : ''}`}>
        <span className={styles.dot} style={{ background: dot }} />
        {title}
        <span className={styles.count}>{count}</span>
      </h2>
      {hasItems ? children : <div className={styles.empty}>{empty}</div>}
      {footer}
    </section>
  );
}

function CardHead({ request, icon: Icon, tone, sub, copy }) {
  return (
    <div className={styles.head}>
      <span className={`${styles.icon} ${styles[`icon_${tone}`]}`} aria-hidden>
        <Icon size={20} />
      </span>
      <div className={styles.grow}>
        <div className={styles.title}>{request.gameTitle}</div>
        <div className={styles.meta}>
          Masa {tableLabel(request.tableNumber)}
          {copy && request.copyInventoryCode && <span className={styles.copy}> · {request.copyInventoryCode}</span>} · {sub}
        </div>
      </div>
    </div>
  );
}

function PendingCard({ request, conflict, games, maxGames, busy, onReserve, onReject }) {
  return (
    <article className={`${styles.card} ${conflict ? styles.cardConflict : styles.cardPending}`}>
      <CardHead request={request} icon={Sparkles} tone="warning" sub={`${formatTime(request.requestedAt)} · ${request.participantName}`} />

      {conflict && (
        <div className={styles.conflict} role="alert">
          <RefreshCw size={15} aria-hidden />
          <p>
            <strong>Nu s-a putut rezerva.</strong> Nu mai e niciun exemplar liber: probabil l-a luat un coleg. Am reîncărcat
            lista.
          </p>
        </div>
      )}

      {maxGames != null && games > 0 && (
        <p className={`${styles.limit} ${games >= maxGames ? styles.limitFull : ''}`}>
          <span className={styles.limitDot} />
          Masa are {games}/{maxGames} jocuri
        </p>
      )}

      <div className={styles.actions}>
        {conflict ? (
          <>
            <Button size="sm" onClick={onReject} disabled={busy}>
              Respinge
            </Button>
            <Button size="sm" variant="secondary" submitting={busy} onClick={onReserve}>
              Încearcă iar
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="secondary" onClick={onReject} disabled={busy}>
              Respinge
            </Button>
            <Button size="sm" submitting={busy} onClick={onReserve}>
              Rezervă
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

function BoardSkeleton() {
  return (
    <div className={styles.board}>
      {Array.from({ length: 4 }, (_, i) => (
        <section key={i} className={styles.column}>
          <Skeleton width="50%" height={16} />
          <div className={styles.card}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} tone={2} />
            <Skeleton width="100%" height={38} />
          </div>
        </section>
      ))}
    </div>
  );
}
