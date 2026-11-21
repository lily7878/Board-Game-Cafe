import { Redirect, usePath } from '../../app/router';
import { GameDetailPage } from './GameDetailPage';
import { GamesPage } from './GamesPage';
import { RecommendationsPage } from './RecommendationsPage';
import { RulesChatPage } from './RulesChatPage';

/** /games, /games/pentru-voi (recommendations), /games/ID (details), /games/ID/reguli (rules assistant). */
export function GamesSection() {
  const sub = usePath().replace(/^\/games\/?/, '');
  if (!sub) return <GamesPage />;
  if (sub === 'pentru-voi') return <RecommendationsPage />;
  if (/^\d+$/.test(sub)) return <GameDetailPage key={sub} gameId={Number(sub)} />;
  const rules = sub.match(/^(\d+)\/reguli$/);
  if (rules) return <RulesChatPage key={rules[1]} gameId={Number(rules[1])} />;
  return <Redirect to="/games" />;
}
