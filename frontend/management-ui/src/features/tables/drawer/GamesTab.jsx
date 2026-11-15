import { Dices, Info, Undo2 } from 'lucide-react';
import { formatTime } from '../../../shared/format';
import { GAME_REQUEST_STATUS } from '../../../shared/statuses';
import { Badge, Button } from '../../../shared/ui';
import styles from './TableDrawer.module.css';

const ORDER = { REQUESTED: 0, RESERVED: 1, DELIVERED: 2, RETURNED: 3, REJECTED: 4, CANCELLED: 5 };

/**
 * 2c — games of the table. The progress bar is the delivered-games limit (x of max).
 * Buttons appear only when the state allows the step:
 * REQUESTED -> Respinge / Rezervă · RESERVED -> Livrează · DELIVERED -> Returnat.
 */
export function GamesTab({ data, actions, pending }) {
  const { details, requests } = data;
  const sorted = [...requests].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const max = details.maxDeliveredGames;

  return (
    <>
      <div className={styles.limit}>
        <span className={styles.grow}>Jocuri livrate la masă</span>
        <span className={styles.segments} aria-hidden>
          {Array.from({ length: max }, (_, i) => (
            <span key={i} className={i < details.gamesAtTable ? styles.segmentOn : styles.segment} />
          ))}
        </span>
        <strong>
          {details.gamesAtTable} din {max}
        </strong>
      </div>

      {sorted.length === 0 && <p className={styles.muted}>Masa nu a cerut încă niciun joc.</p>}

      {sorted.map((request) => {
        const status = GAME_REQUEST_STATUS[request.status];
        const busy = pending === `game-${request.id}`;
        const waiting = request.status === 'REQUESTED';
        const finished = ['RETURNED', 'REJECTED', 'CANCELLED'].includes(request.status);
        return (
          <article
            key={request.id}
            className={`${styles.gameCard} ${waiting ? styles.gameWaiting : ''} ${finished ? styles.gameDone : ''}`}
          >
            <div className={styles.gameHead}>
              <span className={`${styles.gameIcon} ${waiting ? styles.gameIconWaiting : ''}`}>
                <Dices size={20} aria-hidden />
              </span>
              <div className={styles.grow}>
                <div className={styles.personName}>
                  {request.gameTitle}
                  {request.copyInventoryCode && <span className={styles.mutedInline}> · exemplar {request.copyInventoryCode}</span>}
                </div>
                <div className={styles.personMeta}>{gameMeta(request)}</div>
              </div>
              {request.status === 'DELIVERED' ? (
                <Button size="sm" variant="secondary" iconLeft={Undo2} submitting={busy} onClick={() => actions.askReturn(request)}>
                  Returnat
                </Button>
              ) : (
                <Badge tone={status.tone} icon={status.icon}>
                  {status.label}
                </Badge>
              )}
            </div>

            {waiting && (
              <div className={styles.gameActions}>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => actions.askReject(request)}>
                  Respinge
                </Button>
                <Button size="sm" submitting={busy} onClick={() => actions.reserve(request)}>
                  Rezervă exemplar
                </Button>
              </div>
            )}
            {request.status === 'RESERVED' && (
              <div className={styles.gameActions}>
                <Button size="sm" submitting={busy} onClick={() => actions.deliver(request)}>
                  Livrează la masă
                </Button>
              </div>
            )}
          </article>
        );
      })}

      <p className={styles.hint}>
        <Info size={14} aria-hidden />
        Pași: În așteptare → Rezervat → Livrat → Returnat. Butoanele apar doar dacă starea permite.
      </p>
    </>
  );
}

function gameMeta(r) {
  switch (r.status) {
    case 'REQUESTED':
      return `Cerut de ${r.participantName} la ${formatTime(r.requestedAt)}`;
    case 'RESERVED':
      return `Rezervat la ${formatTime(r.reservedAt)} · de dus la masă`;
    case 'DELIVERED':
      return `Livrat la ${formatTime(r.deliveredAt)}`;
    case 'RETURNED':
      return `Returnat la ${formatTime(r.returnedAt)}`;
    default:
      return r.resolutionReason ? `Motiv: ${r.resolutionReason}` : `Cerut la ${formatTime(r.requestedAt)}`;
  }
}
