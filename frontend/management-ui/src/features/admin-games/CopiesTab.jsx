import { useState } from 'react';
import { ChevronDown, Package, Search } from 'lucide-react';
import { Link } from '../../app/router';
import { Badge, Button, Card, EmptyMessage, RowMenu } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { TableSkeleton } from '../admin-menu/ProductsTab';
import { CopyStatusModal } from './CopyModals';
import { COPY_FILTERS, copyState } from './gameModel';
import styles from './Games.module.css';

/** 2m — every physical copy: code, game, state, where it is right now, note. */
export function CopiesTab({ data }) {
  const { copies } = data;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);

  if (copies.loading && !copies.data) return <TableSkeleton />;
  if (copies.error && !copies.data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Package} title="Nu am putut încărca exemplarele" action={<Button variant="secondary" onClick={copies.refetch}>Reîncearcă</Button>}>
          {copies.error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const needle = query.trim().toLocaleLowerCase('ro');
  const rows = copies.data
    .map((c) => ({ ...c, state: copyState(c) }))
    .filter((c) => filter === 'all' || c.state.kind === filter)
    .filter((c) => !needle || c.inventoryCode.toLocaleLowerCase('ro').includes(needle) || c.gameTitle.toLocaleLowerCase('ro').includes(needle))
    .sort((a, b) => a.gameTitle.localeCompare(b.gameTitle, 'ro') || a.inventoryCode.localeCompare(b.inventoryCode, 'ro'));

  return (
    <>
      <div className={admin.toolbar}>
        <label className={admin.search} style={{ marginLeft: 0 }}>
          <Search size={16} aria-hidden />
          <input type="search" placeholder="Cod sau titlu…" aria-label="Caută exemplar" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className={styles.filter}>
          <select aria-label="Stare exemplar" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {COPY_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden />
        </label>
      </div>

      {copies.data.length === 0 ? (
        <Card size="lg">
          <EmptyMessage icon={Package} title="Niciun exemplar în inventar">
            Fiecare joc are nevoie de cel puțin un exemplar fizic ca să poată fi cerut de clienți.
          </EmptyMessage>
        </Card>
      ) : (
        <div className={admin.tableCard}>
          <table className={admin.table}>
            <thead>
              <tr>
                <th>Cod</th>
                <th>Joc</th>
                <th>Stare</th>
                <th>Unde</th>
                <th>Notă</th>
                <th className={admin.actionsCell}>
                  <span hidden>Acțiuni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((copy) => (
                <tr key={copy.id}>
                  <td className={styles.code}>{copy.inventoryCode}</td>
                  <td>
                    <Link to={`/admin/games/${copy.gameId}`} className={styles.plainLink}>
                      {copy.gameTitle}
                    </Link>
                  </td>
                  <td>
                    <Badge tone={copy.state.tone}>{copy.state.label}</Badge>
                  </td>
                  <td className={copy.state.kind === 'table' ? '' : admin.muted}>{copy.state.where}</td>
                  <td className={copy.notes ? '' : admin.muted}>{copy.notes || '—'}</td>
                  <td className={admin.actionsCell}>
                    <RowMenu label={`Acțiuni pentru ${copy.inventoryCode}`} items={[{ label: 'Schimbă starea sau nota', onSelect: () => setEditing(copy) }]} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={admin.muted}>
                    Niciun exemplar nu se potrivește filtrelor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && <CopyStatusModal copy={editing} onClose={() => setEditing(null)} onSaved={data.refetchAll} />}
    </>
  );
}
