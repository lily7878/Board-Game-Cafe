import { ArrowDown, ArrowUp, Coffee, Pencil } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { plural } from '../../shared/format';
import { useAction } from '../../shared/hooks/useAction';
import { Badge, Button, Card, EmptyMessage, RowMenu } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { TableSkeleton } from './ProductsTab';

/**
 * 7b — categories in the order customers see them. Moving one sends the COMPLETE new order
 * (Core requires every category exactly once), so two managers reordering at the same time
 * cannot leave a half-applied order.
 */
export function CategoriesTab({ categories, onEdit, onChanged }) {
  const { run, pending } = useAction();

  if (categories.loading && !categories.data) return <TableSkeleton />;
  if (categories.error && !categories.data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Coffee} title="Nu am putut încărca categoriile" action={<Button variant="secondary" onClick={categories.refetch}>Reîncearcă</Button>}>
          {categories.error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const list = [...categories.data].sort((a, b) => a.sortOrder - b.sortOrder);
  if (list.length === 0) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Coffee} title="Nicio categorie">
          Categoriile grupează produsele în meniul clienților, de ex. Băuturi calde, Deserturi.
        </EmptyMessage>
      </Card>
    );
  }

  const move = (index, delta) => {
    const ids = list.map((c) => c.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    return run('reorder', () => apiRequest('/api/admin/menu-categories/order', { method: 'PUT', body: { categoryIds: ids } }), {
      success: 'Ordinea categoriilor a fost salvată.',
      after: onChanged,
    });
  };
  const setActive = (category, active) =>
    run(`cat-${category.id}`, () => apiRequest(`/api/admin/menu-categories/${category.id}/status`, { method: 'PATCH', body: { active } }), {
      success: active
        ? `${category.name} a fost activată.`
        : `${category.name} a fost dezactivată. Produsele ei nu mai pot fi comandate.`,
      after: onChanged,
    });

  return (
    <div className={admin.tableCard}>
      <table className={admin.table}>
        <thead>
          <tr>
            <th>Ord.</th>
            <th>Categorie</th>
            <th>Descriere</th>
            <th>Produse</th>
            <th>Stare</th>
            <th className={admin.actionsCell}>
              <span hidden>Acțiuni</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((category, index) => (
            <tr key={category.id} className={category.active ? '' : admin.rowInactive}>
              <td style={{ width: 96 }}>
                <div className={admin.rowActions} style={{ justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    className={admin.iconButton}
                    disabled={index === 0 || pending === 'reorder'}
                    onClick={() => move(index, -1)}
                    aria-label={`Mută ${category.name} mai sus`}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className={admin.iconButton}
                    disabled={index === list.length - 1 || pending === 'reorder'}
                    onClick={() => move(index, 1)}
                    aria-label={`Mută ${category.name} mai jos`}
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
              </td>
              <td className={category.active ? admin.strong : ''}>{category.name}</td>
              <td className={admin.muted}>{category.description || '—'}</td>
              <td>{plural(Number(category.productCount), 'produs', 'produse')}</td>
              <td>{category.active ? <Badge tone="success">Activă</Badge> : <Badge tone="neutral">Inactivă</Badge>}</td>
              <td className={admin.actionsCell}>
                <div className={admin.rowActions}>
                  <button type="button" className={admin.iconButton} aria-label={`Editează ${category.name}`} onClick={() => onEdit(category)}>
                    <Pencil size={16} />
                  </button>
                  <RowMenu
                    label={`Mai multe acțiuni pentru ${category.name}`}
                    items={[
                      category.active
                        ? { label: 'Dezactivează categoria', tone: 'danger', onSelect: () => setActive(category, false) }
                        : { label: 'Activează categoria', onSelect: () => setActive(category, true) },
                    ]}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
