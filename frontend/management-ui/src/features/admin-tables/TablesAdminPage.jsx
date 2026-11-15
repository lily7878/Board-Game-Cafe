import { useState } from 'react';
import { Armchair, Pencil, Plus } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { plural, tableLabel } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Badge, Button, Card, EmptyMessage, Skeleton } from '../../shared/ui';
import { TableFormModal } from './TableFormModal';
import styles from './TablesAdmin.module.css';

/** 7a — Configurare mese (MANAGER). One query: the overview has every table + its open session. */
export function TablesAdminPage() {
  const { data: tables, loading, error, refetch } = useApiQuery('/api/admin/tables/overview');
  // Sessions opening/closing change the "Sesiune acum" column and the deactivation rule.
  useLiveRefetch(refetch, ['tables.', 'session.']);

  // null = closed, 'new' = add form, otherwise the table being edited
  const [editing, setEditing] = useState(null);

  if (loading && !tables) return <TableSkeleton />;
  if (error && !tables) {
    return (
      <Card size="lg">
        <EmptyMessage
          icon={Armchair}
          title="Nu am putut încărca mesele"
          action={<Button variant="secondary" onClick={refetch}>Reîncearcă</Button>}
        >
          {error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const activeCount = tables.filter((t) => t.active).length;
  const inactiveCount = tables.length - activeCount;

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.summary}>
          {plural(activeCount, 'masă activă', 'mese active')}
          {inactiveCount > 0 && ` · ${plural(inactiveCount, 'inactivă', 'inactive')}`}
        </p>
        <Button iconLeft={Plus} onClick={() => setEditing('new')}>
          Adaugă masă
        </Button>
      </div>

      {tables.length === 0 ? (
        <Card size="lg">
          <EmptyMessage
            icon={Armchair}
            title="Nicio masă configurată"
            action={<Button iconLeft={Plus} onClick={() => setEditing('new')}>Adaugă prima masă</Button>}
          >
            Adaugă mesele din cafenea. Fiecare masă primește un cod QR propriu când se deschide o sesiune.
          </EmptyMessage>
        </Card>
      ) : (
        <Card size="lg" className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Masă</th>
                <th>Locuri</th>
                <th>Sesiune acum</th>
                <th>Stare</th>
                <th aria-label="Acțiuni" />
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.tableId} className={table.active ? '' : styles.inactive}>
                  <td className={styles.strong}>Masa {tableLabel(table.tableNumber)}</td>
                  <td>{table.capacity}</td>
                  <td>
                    <SessionCell table={table} />
                  </td>
                  <td>
                    {table.active ? <Badge tone="success">Activă</Badge> : <Badge tone="neutral">Inactivă</Badge>}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.edit}
                      onClick={() => setEditing(table)}
                      aria-label={`Editează Masa ${tableLabel(table.tableNumber)}`}
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing && (
        <TableFormModal
          // Remount per table so the form starts from that table's values.
          key={editing === 'new' ? 'new' : editing.tableId}
          table={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={refetch}
        />
      )}
    </>
  );
}

function SessionCell({ table }) {
  if (!table.active) return <span className={styles.muted}>—</span>;
  if (!table.session) return <span className={styles.muted}>liberă</span>;
  return table.session.status === 'CHECKOUT_PENDING' ? 'în checkout' : 'activă';
}

function TableSkeleton() {
  return (
    <Card size="lg" className={styles.tableCard}>
      {[1, 0.8, 0.55].map((opacity) => (
        <div key={opacity} className={styles.skeletonRow} style={{ opacity }}>
          <Skeleton width="20%" />
          <Skeleton width="8%" />
          <Skeleton width="15%" tone={2} />
          <Skeleton width={70} height={22} />
        </div>
      ))}
    </Card>
  );
}
