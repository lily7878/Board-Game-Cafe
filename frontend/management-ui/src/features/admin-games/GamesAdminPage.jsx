import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate, usePath, useSearchParams } from '../../app/router';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, Tabs } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { CopiesTab } from './CopiesTab';
import { CopyFormModal } from './CopyModals';
import { GameCategoriesTab, GameCategoryModal } from './GameCategoriesTab';
import { GameDetailPage } from './GameDetailPage';
import { GameFormPage } from './GameFormPage';
import { GamesTab } from './GamesTab';

const TABS = ['games', 'categories', 'copies'];

/**
 * Jocuri module (1g / 2l / 2m / 2n / 7c). Sub-pages by path:
 *   /admin/games[?tab=categories|copies]   tabs
 *   /admin/games/new, /admin/games/ID/edit  dedicated form page (7c)
 *   /admin/games/ID                         game details (2n)
 * Games, categories and copies are loaded once here and shared by every view, so counters,
 * filters and copy bars stay consistent.
 */
export function GamesAdminPage() {
  const path = usePath();
  const params = useSearchParams();
  const navigate = useNavigate();

  const games = useApiQuery('/api/admin/games');
  const categories = useApiQuery('/api/admin/game-categories');
  const copies = useApiQuery('/api/admin/game-copies');
  const data = {
    games,
    categories,
    copies,
    refetchAll: () => {
      games.refetch();
      categories.refetch();
      copies.refetch();
    },
  };
  // Loans change where copies are (game.reserved / game.delivered / game.returned).
  useLiveRefetch(copies.refetch, ['game.', 'games.']);
  useLiveRefetch(games.refetch, ['games.']);

  const [modal, setModal] = useState(null);

  const sub = path.replace(/^\/admin\/games\/?/, '');
  if (sub === 'new') return <GameFormPage data={data} />;
  const editMatch = sub.match(/^(\d+)\/edit$/);
  if (editMatch) return <GameFormPage data={data} gameId={Number(editMatch[1])} />;
  if (/^\d+$/.test(sub)) return <GameDetailPage data={data} gameId={Number(sub)} />;

  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'games';
  const addLabel = { games: 'Adaugă joc', categories: 'Adaugă categorie', copies: 'Adaugă exemplar' }[tab];
  const onAdd = () => {
    if (tab === 'games') navigate('/admin/games/new');
    else setModal(tab);
  };

  return (
    <>
      <div className={admin.header}>
        <Tabs
          surface="tinted"
          ariaLabel="Secțiuni jocuri"
          value={tab}
          onChange={(next) => navigate(next === 'games' ? '/admin/games' : `/admin/games?tab=${next}`, { replace: true })}
          tabs={[
            { value: 'games', label: 'Jocuri', count: games.data?.length },
            { value: 'categories', label: 'Categorii', count: categories.data?.length },
            { value: 'copies', label: 'Exemplare', count: copies.data?.length },
          ]}
        />
        <div className={admin.headerEnd}>
          <Button iconLeft={Plus} onClick={onAdd}>
            {addLabel}
          </Button>
        </div>
      </div>

      {tab === 'games' && <GamesTab data={data} />}
      {tab === 'categories' && <GameCategoriesTab data={data} onEdit={(record) => setModal({ kind: 'category', record })} />}
      {tab === 'copies' && <CopiesTab data={data} />}

      {(modal === 'categories' || modal?.kind === 'category') && (
        <GameCategoryModal category={modal?.record} onClose={() => setModal(null)} onSaved={data.refetchAll} />
      )}
      {modal === 'copies' && <CopyFormModal games={games.data ?? []} onClose={() => setModal(null)} onSaved={data.refetchAll} />}
    </>
  );
}
