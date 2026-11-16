import { useState } from 'react';
import { ChevronDown, ChevronUp, ClipboardList, Coffee, Dices, Receipt, TriangleAlert, Users } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { formatMoney, plural, tableLabel } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, Skeleton } from '../../shared/ui';
import styles from './Dashboard.module.css';

/**
 * 3b — the table as seen from this phone: who is here, what is going on, and four big tiles.
 * Every live event of the table refreshes it (the topic only carries this table's events).
 */
export function DashboardPage() {
  const current = useApiQuery('/api/participant/sessions/current');
  const bill = useApiQuery('/api/participant/sessions/current/bill');
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  useLiveRefetch(current.refetch, () => true);
  useLiveRefetch(bill.refetch, ['order.', 'session.', 'game.']);

  const s = current.data;
  return (
    <MobileShell title="Board Game Café">
      {!s ? (
        current.error ? (
          <div className={styles.errorCard}>
            <p>Nu am putut încărca masa.</p>
            <Button variant="secondary" onClick={current.refetch}>
              Reîncearcă
            </Button>
          </div>
        ) : (
          <div className={styles.summary}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="65%" height={34} />
            <Skeleton width="100%" height={120} tone={2} />
          </div>
        )
      ) : (
        <>
          {s.status === 'CHECKOUT_PENDING' && (
            <button type="button" className={styles.checkoutBanner} onClick={() => navigate('/bill')}>
              <TriangleAlert size={18} aria-hidden />
              <span>
                <strong>Masa este în checkout.</strong> Comenzile și cererile noi sunt oprite până la plată.
              </span>
            </button>
          )}

          <section className={styles.summary}>
            <span className={styles.overline}>
              <span className={styles.dot} aria-hidden /> Masa {tableLabel(s.tableNumber)} · {s.status === 'ACTIVE' ? 'activă' : 'checkout'}
            </span>
            <h2 className={styles.hello}>Bună, {s.displayName}!</h2>
            <p className={styles.people}>
              <Users size={16} aria-hidden /> {plural(s.participants.length, 'participant conectat', 'participanți conectați')}
            </p>

            <div className={styles.details}>
              <button type="button" className={styles.detailsHead} aria-expanded={expanded} onClick={() => setExpanded((e) => !e)}>
                Detalii masă {expanded ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
              </button>
              {expanded && (
                <dl className={styles.rows}>
                  <div>
                    <dt>Participanți</dt>
                    <dd>{s.participants.map((p) => (p.me ? `${p.displayName} (tu)` : p.displayName)).join(', ')}</dd>
                  </div>
                  <div>
                    <dt>Comenzi active</dt>
                    <dd>{s.activeOrders === 0 ? 'niciuna' : `${s.activeOrders}${s.myActiveOrders ? ` · ${s.myActiveOrders} ale tale` : ''}`}</dd>
                  </div>
                  <div>
                    <dt>Jocuri la masă</dt>
                    <dd>
                      {s.games.filter((g) => g.status === 'DELIVERED').map((g) => g.title).join(', ') || 'niciunul'}
                      {` · ${s.gamesAtTable}/${s.maxDeliveredGames}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Nota curentă</dt>
                    <dd>{bill.data ? `${formatMoney(bill.data.menuTotal)}${bill.data.feesLocked ? ` + ${formatMoney(bill.data.feesTotal)} acces` : ' + acces'}` : '…'}</dd>
                  </div>
                </dl>
              )}
            </div>
          </section>

          <h2 className={styles.sectionTitle}>Ce vrei să faci?</h2>
          <div className={styles.tiles}>
            <Tile icon={Coffee} title="Meniu" text="Băuturi și gustări" onClick={() => navigate('/menu')} />
            <Tile icon={Dices} title="Jocuri" text="Catalog și recomandări" onClick={() => navigate('/games')} />
            <Tile
              icon={ClipboardList}
              title="Comenzile mele"
              text="Vezi progresul"
              badge={s.myActiveOrders ? `${s.myActiveOrders} în lucru` : null}
              onClick={() => navigate('/orders')}
            />
            <Tile icon={Receipt} title="Nota mesei" text="Total comun și plată" dark onClick={() => navigate('/bill')} />
          </div>
        </>
      )}
    </MobileShell>
  );
}

function Tile({ icon: Icon, title, text, badge, dark, onClick }) {
  return (
    <button type="button" className={`${styles.tile} ${dark ? styles.tileDark : ''}`} onClick={onClick}>
      {badge && <span className={styles.tileBadge}>{badge}</span>}
      <span className={styles.tileIcon} aria-hidden>
        <Icon size={22} />
      </span>
      <strong>{title}</strong>
      <span>{text}</span>
    </button>
  );
}
