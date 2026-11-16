import { Redirect, usePath } from '../../app/router';
import { GameDetailPage } from './GameDetailPage';
import { GamesPage } from './GamesPage';
import { RecommendationsPage } from './RecommendationsPage';

/** /games, /games/pentru-voi (recommendations), /games/ID (details). */
export function GamesSection() {
  const sub = usePath().replace(/^\/games\/?/, '');
  if (!sub) return <GamesPage />;
  if (sub === 'pentru-voi') return <RecommendationsPage />;
  if (/^\d+$/.test(sub)) return <GameDetailPage key={sub} gameId={Number(sub)} />;
  return <Redirect to="/games" />;
}
