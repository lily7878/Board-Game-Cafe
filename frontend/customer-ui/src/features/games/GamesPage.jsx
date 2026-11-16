import { useState } from 'react';
import { ArrowRight, Dices, Search, SlidersHorizontal, Sparkles, Users } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { BottomSheet, Button, EmptyMessage, Skeleton, Stepper, Toggle } from '../../shared/ui';
import { GameIcon } from './GameIcon';
import { DIFFICULTY, availability, catalogPath, duration } from './gameModel';
import styles from './Games.module.css';

const DURATIONS = [
  { value: null, label: 'Oricât' },
  { value: 30, label: 'Sub 30 min' },
  { value: 45, label: 'Sub 45 min' },
  { value: 60, label: 'Sub o oră' },
  { value: 120, label: 'Sub 2 ore' },
];

const EMPTY_FILTERS = { players: null, maxDuration: null, difficulty: null, categoryId: null, availableOnly: false };

/**
 * 4b / 4c — game catalog: one big card per game, quick chips and an advanced filter sheet.
 * Filters go to Core (players, duration, difficulty, category, only available); the title search
 * is done here because the catalog is small and Core has no text search.
 */
export function GamesPage() {
  const navigate = useNavigate();
  const current = useApiQuery('/api/participant/sessions/current');
  const categories = useApiQuery('/api/participant/game-categories');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const catalog = useApiQuery(catalogPath(filters));
  useLiveRefetch(catalog.refetch, ['games.', 'game.']);

  const tablePeople = current.data?.participants.length ?? null;
  const toggle = (patch, on) => setFilters((f) => ({ ...f, ...(on ? Object.fromEntries(Object.keys(patch).map((k) => [k, EMPTY_FILTERS[k]])) : patch) }));
  const activeCount = Object.entries(filters).filter(([, v]) => v).length;

  const chips = [
    tablePeople && { key: 'players', label: `Pentru ${tablePeople}`, icon: Users, on: filters.players === tablePeople, patch: { players: tablePeople } },
    { key: 'available', label: 'Disponibile acum', on: filters.availableOnly, patch: { availableOnly: true } },
    { key: 'short', label: 'Sub 45 min', on: filters.maxDuration === 45, patch: { maxDuration: 45 } },
    { key: 'easy', label: 'Ușoare', on: filters.difficulty === 'EASY', patch: { difficulty: 'EASY' } },
  ].filter(Boolean);

  const needle = query.trim().toLocaleLowerCase('ro');
  const games = (catalog.data?.content ?? []).filter((g) => !needle || g.title.toLocaleLowerCase('ro').includes(needle));
  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));

  return (
    <MobileShell title="Jocuri">
      <div className={styles.searchRow}>
        <label className={styles.search}>
          <Search size={18} aria-hidden />
          <input type="search" placeholder="Caută un joc…" aria-label="Caută un joc" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button type="button" className={styles.filterButton} onClick={() => setSheetOpen(true)} aria-label={`Filtre${activeCount ? `, ${activeCount} active` : ''}`}>
          <SlidersHorizontal size={20} />
          {activeCount > 0 && <span className={styles.filterCount}>{activeCount}</span>}
        </button>
      </div>

      <div className={styles.chips}>
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button key={chip.key} type="button" aria-pressed={chip.on} className={`${styles.chip} ${chip.on ? styles.chipOn : ''}`} onClick={() => toggle(chip.patch, chip.on)}>
              {Icon && <Icon size={16} aria-hidden />} {chip.label}
            </button>
          );
        })}
      </div>

      <button type="button" className={styles.recoBanner} onClick={() => navigate('/games/pentru-voi')}>
        <span className={styles.recoIcon} aria-hidden>
          <Sparkles size={20} />
        </span>
        <span>
          <strong>Nu știți ce să alegeți?</strong>
          Răspundeți la 3 întrebări
        </span>
        <ArrowRight size={20} aria-hidden />
      </button>

      {catalog.loading && !catalog.data ? (
        [1, 0.7].map((o) => (
          <div key={o} className={styles.card} style={{ opacity: o }}>
            <Skeleton width="55%" height={22} />
            <Skeleton width="100%" height={60} tone={2} />
          </div>
        ))
      ) : catalog.error && !catalog.data ? (
        <EmptyMessage icon={Dices} title="Nu am putut încărca jocurile" action={<Button variant="secondary" onClick={catalog.refetch}>Reîncearcă</Button>}>
          Verifică conexiunea și încearcă din nou.
        </EmptyMessage>
      ) : games.length === 0 ? (
        <EmptyMessage
          icon={Dices}
          title="Niciun joc potrivit"
          action={activeCount > 0 && <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>Șterge filtrele</Button>}
        >
          Încearcă alte filtre sau întreabă personalul.
        </EmptyMessage>
      ) : (
        games.map((game) => {
          const avail = availability(game);
          return (
            <button key={game.id} type="button" className={styles.card} onClick={() => navigate(`/games/${game.id}`)}>
              <div className={styles.cardHead}>
                <span className={styles.icon} aria-hidden>
                  <GameIcon id={game.id} size={28} />
                </span>
                <div>
                  <h2>{game.title}</h2>
                  <div className={styles.tags}>
                    {[...(game.categoryIds ?? [])].map((id) => categoryName.get(id)).filter(Boolean).map((name) => (
                      <span key={name}>{name}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.facts}>
                <span>
                  Jucători<strong>{game.minPlayers === game.maxPlayers ? game.minPlayers : `${game.minPlayers}–${game.maxPlayers}`}</strong>
                </span>
                <span>
                  Durată<strong>{duration(game)}</strong>
                </span>
                <span>
                  Dificultate<strong>{DIFFICULTY[game.difficulty] ?? '—'}</strong>
                </span>
              </div>
              <span className={`${styles.avail} ${styles[`avail_${avail.tone}`]}`}>
                <i aria-hidden /> {avail.text}
              </span>
            </button>
          );
        })
      )}

      {sheetOpen && (
        <FilterSheet
          initial={filters}
          categories={categories.data ?? []}
          onClose={() => setSheetOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setSheetOpen(false);
          }}
        />
      )}
    </MobileShell>
  );
}

/** 4c — advanced filters; applied together, so the list does not jump while choosing. */
function FilterSheet({ initial, categories, onClose, onApply }) {
  const [f, setF] = useState(initial);
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  return (
    <BottomSheet open onClose={onClose} label="Filtre">
      <h2 className={styles.sheetTitle}>Filtre</h2>

      <div className={styles.sheetField}>
        <span>Jucători</span>
        <div className={styles.sheetRow}>
          <Stepper value={f.players ?? 0} onChange={(v) => set({ players: v || null })} min={0} max={12} label="Număr de jucători" />
          <span className={styles.muted}>{f.players ? `jocuri pentru ${f.players}` : 'oricâți'}</span>
        </div>
      </div>

      <div className={styles.sheetField}>
        <span>Durată</span>
        <div className={styles.options}>
          {DURATIONS.map((d) => (
            <button key={d.label} type="button" aria-pressed={f.maxDuration === d.value} className={`${styles.option} ${f.maxDuration === d.value ? styles.optionOn : ''}`} onClick={() => set({ maxDuration: d.value })}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.sheetField}>
        <span>Dificultate</span>
        <div className={styles.options}>
          {[[null, 'Oricare'], ...Object.entries(DIFFICULTY)].map(([value, label]) => (
            <button key={label} type="button" aria-pressed={f.difficulty === value} className={`${styles.option} ${f.difficulty === value ? styles.optionOn : ''}`} onClick={() => set({ difficulty: value })}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div className={styles.sheetField}>
          <span>Categorie</span>
          <div className={styles.options}>
            {[{ id: null, name: 'Toate' }, ...categories].map((c) => (
              <button key={c.name} type="button" aria-pressed={f.categoryId === c.id} className={`${styles.option} ${f.categoryId === c.id ? styles.optionOn : ''}`} onClick={() => set({ categoryId: c.id })}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Toggle label="Doar jocurile disponibile acum" checked={f.availableOnly} onChange={(v) => set({ availableOnly: v })} size="lg" />

      <div className={styles.sheetActions}>
        <Button variant="secondary" size="lg" onClick={() => setF(EMPTY_FILTERS)}>
          Resetează
        </Button>
        <Button size="lg" onClick={() => onApply(f)}>
          Vezi jocurile
        </Button>
      </div>
    </BottomSheet>
  );
}
