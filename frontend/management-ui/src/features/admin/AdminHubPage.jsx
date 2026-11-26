import { ArrowRight } from 'lucide-react';
import { Link } from '../../app/router';
import { ADMIN_NAV } from '../../app/navigation';
import { formatMoney, plural } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Skeleton } from '../../shared/ui';
import admin from './Admin.module.css';
import styles from './AdminHub.module.css';

const DESCRIPTIONS = {
  '/admin/staff': 'Conturi pentru staff și manager, roluri, activare și dezactivare.',
  '/admin/tables': 'Numărul mesei, capacitatea și activarea.',
  '/admin/games': 'Titluri, categorii, exemplare și reguli PDF.',
  '/admin/menu': 'Produse, categorii, prețuri și disponibilitate.',
  '/admin/settings': 'Tarif de acces, limită jocuri pe masă și program informativ.',
  '/admin/reports': 'Ziua curentă, închiderea zilei și istoricul zilelor simulate.',
};

/**
 * 2j — Administrare hub. Each card shows one live figure of its module; the figures load
 * independently, so a slow endpoint only leaves its own card with a placeholder.
 */
export function AdminHubPage() {
  const staff = useApiQuery('/api/admin/staff');
  const tables = useApiQuery('/api/admin/tables/overview');
  const games = useApiQuery('/api/admin/games');
  const menu = useApiQuery('/api/admin/menu-items');
  const settings = useApiQuery('/api/admin/settings');
  const day = useApiQuery('/api/admin/business-days/current');

  const figures = {
    '/admin/staff':
      staff.data &&
      `${plural(staff.data.length, 'cont', 'conturi')} · ${plural(staff.data.filter((s) => !s.active).length, 'inactiv', 'inactive')}`,
    '/admin/tables': tables.data && plural(tables.data.filter((t) => t.active).length, 'masă activă', 'mese active'),
    '/admin/games':
      games.data &&
      `${plural(games.data.filter((g) => g.active).length, 'titlu', 'titluri')} · ${plural(
        games.data.reduce((sum, g) => sum + Number(g.totalCopies ?? 0), 0),
        'exemplar',
        'exemplare',
      )}`,
    '/admin/menu':
      menu.data &&
      `${plural(menu.data.filter((m) => m.active).length, 'produs', 'produse')} · ${plural(
        menu.data.filter((m) => m.active && !m.available).length,
        'epuizat',
        'epuizate',
      )}`,
    '/admin/settings': settings.data && `${formatMoney(settings.data.accessFeePrice)} / persoană`,
    '/admin/reports': day.data && `Ziua #${day.data.dayNumber} ${day.data.status === 'OPEN' ? 'deschisă' : 'închisă'}`,
  };

  const modules = ADMIN_NAV.filter((item) => item.path !== '/admin');

  return (
    <>
      {/* <p className={admin.lead}>Configurarea cafenelei. Datele cu istoric se dezactivează, nu se șterg.</p> */}
      <div className={styles.grid}>
        {modules.map((item) => {
          const Icon = item.icon;
          const dark = item.path === '/admin/reports';
          return (
            <Link key={item.path} to={item.path} className={`${styles.card} ${dark ? styles.dark : ''}`}>
              <span className={styles.icon} aria-hidden>
                <Icon size={22} />
              </span>
              <h2 className={styles.title}>{dark ? 'Rapoarte și End of Day' : item.label}</h2>
              <p className={styles.text}>{DESCRIPTIONS[item.path]}</p>
              <span className={styles.foot}>
                {figures[item.path] ?? <Skeleton width={120} height={12} tone={dark ? 2 : 1} />}
                <ArrowRight size={18} aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
