import { useState } from 'react';
import { ArrowLeft, Pencil, Plus, Puzzle } from 'lucide-react';
import { Link, useNavigate } from '../../app/router';
import { Badge, Button, Card, EmptyMessage, RowMenu, Skeleton } from '../../shared/ui';
import { CopyFormModal, CopyStatusModal } from './CopyModals';
import { DIFFICULTY, copiesByGame, duration, players } from './gameModel';
import { GameIcon } from './GameIcon';
import { RulesPdfPanel } from './RulesPdfPanel';
import styles from './Games.module.css';

/** 2n — one game: facts, short rules, and every physical copy with where it is now. */
export function GameDetailPage({ data, gameId }) {
  const { games, categories, copies } = data;
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  const game = games.data?.find((g) => g.id === gameId);
  if (games.loading && !games.data) {
    return (
      <Card size="lg">
        <Skeleton width="40%" height={28} />
        <Skeleton width="100%" height={80} tone={2} style={{ marginTop: 20 }} />
      </Card>
    );
  }
  if (!game) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Puzzle} title="Jocul nu există" action={<Button onClick={() => navigate('/admin/games')}>Înapoi la jocuri</Button>}>
          Poate a fost un link greșit.
        </EmptyMessage>
      </Card>
    );
  }

  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const gameCopies = copiesByGame(copies.data).get(game.id) ?? [];
  const available = gameCopies.filter((c) => c.state.kind === 'available').length;

  return (
    <>
      <Breadcrumb current={game.title} />
      <div className={styles.detail}>
        <div className={styles.detailMain}>
          <Card size="lg" className={styles.panel}>
            <div className={styles.detailHead}>
              <span className={styles.bigIcon} aria-hidden>
                <GameIcon id={game.id} size={40} />
              </span>
              <div className={styles.grow}>
                <div className={styles.detailTitleRow}>
                  <h2 className={styles.detailTitle}>{game.title}</h2>
                  {game.active ? <Badge tone="success">Activ în catalog</Badge> : <Badge tone="neutral">Ascuns din catalog</Badge>}
                </div>
                <div className={styles.tags}>
                  {(game.categoryIds ?? []).map((id) => (
                    <span key={id} className={styles.tag}>
                      {categoryName.get(id) ?? '…'}
                    </span>
                  ))}
                </div>
              </div>
              <Button variant="secondary" size="sm" iconLeft={Pencil} onClick={() => navigate(`/admin/games/${game.id}/edit`)}>
                Editează
              </Button>
            </div>
            {game.description && <p className={styles.description}>{game.description}</p>}
            <div className={styles.stats}>
              <Stat label="Jucători" value={players(game)} />
              <Stat label="Durată" value={duration(game)} />
              <Stat label="Dificultate" value={DIFFICULTY[game.difficulty] ?? '—'} />
              <Stat label="Vârstă" value={`${game.minimumAge}+`} />
            </div>
          </Card>

          <Card size="lg" className={styles.panel}>
            <h3 className={styles.panelTitle}>Reguli</h3>
            {game.shortRules ? (
              <p className={styles.rules}>{game.shortRules}</p>
            ) : (
              <p className={styles.muted}>Nu există încă reguli pe scurt. Le poți adăuga din „Editează”.</p>
            )}
            <RulesPdfPanel gameId={game.id} />
          </Card>
        </div>

        <Card size="lg" className={styles.panel}>
          <div className={styles.copiesTitle}>
            <h3 className={styles.panelTitle}>
              Exemplare <span className={styles.muted}>{gameCopies.length}</span>
            </h3>
            <Button size="sm" variant="secondary" iconLeft={Plus} onClick={() => setAdding(true)}>
              Adaugă
            </Button>
          </div>
          {gameCopies.length === 0 && <p className={styles.muted}>Niciun exemplar. Clienții nu pot cere jocul până nu adaugi unul.</p>}
          {gameCopies.map((copy) => (
            <div key={copy.id} className={styles.copyRow}>
              <span className={styles.code}>{copy.inventoryCode}</span>
              <span className={styles.grow}>
                {copy.state.where}
                {copy.notes && <span className={styles.muted}> · {copy.notes}</span>}
              </span>
              <Badge tone={copy.state.tone}>{copy.state.label}</Badge>
              <RowMenu label={`Acțiuni pentru ${copy.inventoryCode}`} items={[{ label: 'Schimbă starea sau nota', onSelect: () => setEditing(copy) }]} />
            </div>
          ))}
          {gameCopies.length > 0 && (
            <div className={styles.availableRow}>
              <span>Disponibile pentru cereri</span>
              <strong>
                {available} din {gameCopies.length}
              </strong>
            </div>
          )}
        </Card>
      </div>

      {adding && <CopyFormModal games={games.data} gameId={game.id} onClose={() => setAdding(false)} onSaved={data.refetchAll} />}
      {editing && <CopyStatusModal copy={editing} onClose={() => setEditing(null)} onSaved={data.refetchAll} />}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Breadcrumb({ current }) {
  return (
    <nav className={styles.breadcrumb} aria-label="Navigare">
      <Link to="/admin/games" className={styles.back} aria-label="Înapoi la jocuri">
        <ArrowLeft size={18} />
      </Link>
      <Link to="/admin/games" className={styles.plainLink}>
        Jocuri
      </Link>
      <span className={styles.muted}>/</span>
      <strong>{current}</strong>
    </nav>
  );
}
