import { useState } from 'react';
import { BookOpen, Dices, MessageCircleOff } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { apiRequest } from '../../shared/api/http';
import { describeError } from '../../shared/api/errors';
import { tableLabel } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { BottomSheet, Button, EmptyMessage, Skeleton, useToast } from '../../shared/ui';
import { GameIcon } from './GameIcon';
import { DIFFICULTY, availability, durationLong, players } from './gameModel';
import styles from './Games.module.css';

/**
 * 4d — game details and the request confirmation sheet (availability, games at the table x/3).
 * 4f — the rules assistant needs a processed PDF manual; Core has none yet, so the screen says
 * so explicitly instead of inventing rules. The short rules written by the manager are shown.
 */
export function GameDetailPage({ gameId }) {
  const navigate = useNavigate();
  const toast = useToast();
  const game = useApiQuery(`/api/participant/games/${gameId}`);
  const current = useApiQuery('/api/participant/sessions/current');
  const categories = useApiQuery('/api/participant/game-categories');
  useLiveRefetch(game.refetch, ['games.', 'game.']);
  useLiveRefetch(current.refetch, ['game.', 'session.']);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  async function request() {
    setSending(true);
    try {
      await apiRequest('/api/participant/game-requests', { method: 'POST', body: { gameId } });
      toast.success(`Cererea pentru ${game.data.title} a fost trimisă.`);
      navigate('/game-requests');
    } catch (error) {
      setSending(false);
      setConfirming(false);
      game.refetch();
      current.refetch();
      // 6d: refused by Core -> say why, reload, never resend on our own.
      if (error.isConflict) toast.error('Masa este în checkout, așa că nu se mai pot cere jocuri noi.');
      else if (error.status === 404) toast.error('Jocul nu mai este în catalog.');
      else toast.error(describeError(error));
    }
  }

  if (game.loading && !game.data) {
    return (
      <MobileShell title="Joc" back="/games">
        <Skeleton width="100%" height={220} />
      </MobileShell>
    );
  }
  if (!game.data) {
    return (
      <MobileShell title="Joc" back="/games">
        <EmptyMessage icon={Dices} title="Jocul nu mai este disponibil" action={<Button onClick={() => navigate('/games')}>Înapoi la jocuri</Button>}>
          Poate a fost scos din catalog între timp.
        </EmptyMessage>
      </MobileShell>
    );
  }

  const g = game.data;
  const avail = availability(g);
  const s = current.data;
  const checkout = s?.status === 'CHECKOUT_PENDING';
  const atLimit = s && s.gamesAtTable >= s.maxDeliveredGames;
  const names = new Map((categories.data ?? []).map((c) => [c.id, c.name]));

  return (
    <MobileShell title={g.title} back="/games">
      <section className={styles.detail}>
        <span className={styles.bigIcon} aria-hidden>
          <GameIcon id={g.id} size={40} />
        </span>
        <h2 className={styles.detailTitle}>{g.title}</h2>
        <div className={styles.tags}>
          {[...(g.categoryIds ?? [])].map((id) => names.get(id)).filter(Boolean).map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        {g.description && <p className={styles.description}>{g.description}</p>}
        <div className={styles.facts}>
          <span>
            Jucători<strong>{players(g)}</strong>
          </span>
          <span>
            Durată<strong>{durationLong(g)}</strong>
          </span>
          <span>
            Dificultate<strong>{DIFFICULTY[g.difficulty] ?? '—'}</strong>
          </span>
          <span>
            Vârstă<strong>{g.minimumAge}+</strong>
          </span>
        </div>
        <span className={`${styles.avail} ${styles[`avail_${avail.tone}`]}`}>
          <i aria-hidden /> {avail.text}
        </span>
      </section>

      <section className={styles.rulesCard}>
        <h3>
          <BookOpen size={18} aria-hidden /> Reguli pe scurt
        </h3>
        {g.shortRules ? <p>{g.shortRules}</p> : <p className={styles.muted}>Nu există încă un rezumat al regulilor.</p>}
        <div className={styles.assistantOff}>
          <MessageCircleOff size={18} aria-hidden />
          <span>Asistentul de reguli nu este disponibil pentru acest joc: manualul nu a fost încărcat. Personalul vă poate explica regulile.</span>
        </div>
      </section>

      <Button size="lg" fullWidth disabled={checkout || g.availableCopies === 0} onClick={() => setConfirming(true)}>
        {checkout ? 'Masa este în checkout' : g.availableCopies === 0 ? 'Niciun exemplar liber acum' : 'Cere jocul'}
      </Button>

      {confirming && (
        <BottomSheet open onClose={() => !sending && setConfirming(false)} label={`Cereți ${g.title}?`}>
          <h2 className={styles.sheetTitle}>Cereți {g.title}?</h2>
          <div className={styles.summaryBox}>
            <div>
              <span>Disponibilitate</span>
              <strong className={styles[`text_${avail.tone}`]}>{g.availableCopies === 1 ? '1 exemplar' : `${g.availableCopies} exemplare`}</strong>
            </div>
            {s && (
              <div>
                <span>Jocuri la masă</span>
                <strong>
                  {s.gamesAtTable} din {s.maxDeliveredGames}
                </strong>
              </div>
            )}
          </div>
          <p className={styles.muted}>
            {atLimit
              ? `Masa are deja ${s.maxDeliveredGames} jocuri. Personalul aduce jocul după ce returnați unul.`
              : `Personalul confirmă cererea și aduce jocul la Masa ${tableLabel(s?.tableNumber)}. Urmăriți statusul în „Cererile mele”.`}
          </p>
          <div className={styles.sheetActions}>
            <Button variant="secondary" size="lg" onClick={() => setConfirming(false)} disabled={sending}>
              Renunță
            </Button>
            <Button size="lg" submitting={sending} onClick={request}>
              Trimite cererea
            </Button>
          </div>
        </BottomSheet>
      )}
    </MobileShell>
  );
}
