import { useState } from 'react';
import { Ban, ChevronDown, Clock, Dices, EyeOff, Gauge, Pencil, Search, Users } from 'lucide-react';
import { Link, useNavigate } from '../../app/router';
import { apiRequest } from '../../shared/api/http';
import { plural } from '../../shared/format';
import { useAction } from '../../shared/hooks/useAction';
import { Badge, Button, Card, EmptyMessage, RowMenu, Skeleton } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { DIFFICULTY, copiesByGame, duration, players } from './gameModel';
import { GameIcon } from './GameIcon';
import styles from './Games.module.css';

/** 1g — game cards with a bar per physical copy (green = on the shelf, rose = at a table, sand = out of use). */
export function GamesTab({ data }) {
  const { games, categories, copies } = data;
  const navigate = useNavigate();
  const { run, pending } = useAction();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  if (games.loading && !games.data) return <CardsSkeleton />;
  if (games.error && !games.data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Dices} title="Nu am putut încărca jocurile" action={<Button variant="secondary" onClick={games.refetch}>Reîncearcă</Button>}>
          {games.error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const byGame = copiesByGame(copies.data);
  const needle = query.trim().toLocaleLowerCase('ro');
  const list = games.data
    .filter((g) => !needle || g.title.toLocaleLowerCase('ro').includes(needle))
    .filter((g) => category === 'all' || g.categoryIds?.includes(Number(category)))
    .filter((g) => status === 'all' || (status === 'active') === g.active)
    .sort((a, b) => Number(b.active) - Number(a.active) || a.title.localeCompare(b.title, 'ro'));

  const setActive = (game, active) =>
    run(`game-${game.id}`, () => apiRequest(`/api/admin/games/${game.id}/status`, { method: 'PATCH', body: { active } }), {
      success: active ? `${game.title} apare din nou în catalog.` : `${game.title} a fost ascuns din catalogul clienților.`,
      after: data.refetchAll,
    });

  return (
    <>
      <div className={admin.toolbar}>
        <label className={admin.search} style={{ marginLeft: 0 }}>
          <Search size={16} aria-hidden />
          <input type="search" placeholder="Caută după titlu…" aria-label="Caută joc" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className={styles.filter}>
          <select aria-label="Categorie" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Toate categoriile</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden />
        </label>
        <label className={styles.filter}>
          <select aria-label="Stare" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Stare: toate</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown size={16} aria-hidden />
        </label>
        <span className={styles.legend}>
          <i className={styles.legendAvailable} /> disponibil <i className={styles.legendTable} /> la masă <i className={styles.legendOut} /> indisponibil
        </span>
      </div>

      {games.data.length === 0 ? (
        <Card size="lg">
          <EmptyMessage icon={Dices} title="Niciun joc în catalog" action={<Button onClick={() => navigate('/admin/games/new')}>Adaugă primul joc</Button>}>
            Adaugă jocurile, apoi exemplarele fizice ale fiecăruia (ex. CAT-01, CAT-02).
          </EmptyMessage>
        </Card>
      ) : list.length === 0 ? (
        <p className={admin.lead}>Niciun joc nu se potrivește filtrelor.</p>
      ) : (
        <div className={styles.grid}>
          {list.map((game) => {
                      const gameCopies = byGame.get(game.id) ?? [];
            const available = gameCopies.filter((c) => c.state.kind === 'available').length;
            return (
              <article key={game.id} className={`${styles.card} ${game.active ? '' : styles.cardInactive}`}>
                <div className={styles.cardHead}>
                  <span className={styles.icon} aria-hidden>
                    <GameIcon id={game.id} size={24} />
                  </span>
                  <div className={styles.grow}>
                    <h2 className={styles.title}>
                      <Link to={`/admin/games/${game.id}`} className={styles.titleLink}>
                        {game.title}
                      </Link>
                    </h2>
                    <div className={styles.tags}>
                      {(game.categoryIds ?? []).map((id) => (
                        <span key={id} className={styles.tag}>
                          {categoryName.get(id) ?? '…'}
                        </span>
                      ))}
                    </div>
                  </div>
                  {game.active && <Badge tone="success">Activ</Badge>}
                </div>

                <div className={styles.facts}>
                  <span>
                    <Users size={15} aria-hidden /> {players(game)}
                  </span>
                  <span>
                    <Clock size={15} aria-hidden /> {duration(game)}
                  </span>
                  <span>
                    <Gauge size={15} aria-hidden /> {DIFFICULTY[game.difficulty] ?? '—'}
                  </span>
                </div>

                {game.active ? (
                  <div className={styles.copiesBox}>
                    <div className={styles.copiesHead}>
                      <span>Exemplare</span>
                      <strong>
                        {gameCopies.length === 0
                          ? 'niciun exemplar'
                          : `${available} ${available === 1 ? 'disponibil' : 'disponibile'} din ${gameCopies.length}`}
                      </strong>
                    </div>
                    {gameCopies.length > 0 && (
                      <div className={styles.bars} aria-hidden>
                        {gameCopies.map((c) => (
                          <span key={c.id} className={styles[`bar_${c.state.kind}`]} title={`${c.inventoryCode}: ${c.state.label}`} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.hiddenNote}>
                    <EyeOff size={16} aria-hidden /> Ascuns din catalogul clienților. Istoricul se păstrează.
                  </p>
                )}

                <div className={styles.cardFoot}>
                  {game.active ? (
                    <>
                      <span className={styles.rulesTag}>{game.shortRules ? 'Reguli pe scurt' : 'Fără reguli pe scurt'}</span>
                      <button type="button" className={admin.iconButton} aria-label={`Editează ${game.title}`} onClick={() => navigate(`/admin/games/${game.id}/edit`)}>
                        <Pencil size={16} />
                      </button>
                      <RowMenu
                        label={`Mai multe acțiuni pentru ${game.title}`}
                        items={[
                          { label: 'Vezi detalii și exemplare', onSelect: () => navigate(`/admin/games/${game.id}`) },
                          { label: 'Ascunde din catalog', tone: 'danger', onSelect: () => setActive(game, false) },
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      <Badge tone="neutral" icon={Ban}>
                        Inactiv
                      </Badge>
                      <Button size="sm" variant="secondary" submitting={pending === `game-${game.id}`} onClick={() => setActive(game, true)}>
                        Reactivează
                      </Button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {games.data.length > 0 && (
        <p className={admin.small}>
          {plural(games.data.filter((g) => g.active).length, 'titlu activ', 'titluri active')} ·{' '}
          {plural(copies.data?.length ?? 0, 'exemplar', 'exemplare')} în inventar
        </p>
      )}
    </>
  );
}

function CardsSkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={styles.card} style={{ opacity: i < 3 ? 1 : 0.6 }}>
          <Skeleton width="55%" height={18} />
          <Skeleton width="35%" height={12} tone={2} />
          <Skeleton width="100%" height={64} />
        </div>
      ))}
    </div>
  );
}
