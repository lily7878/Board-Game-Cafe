import { useState } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, CircleMinus, Coffee, Pencil, Search } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { formatMoney } from '../../shared/format';
import { useAction } from '../../shared/hooks/useAction';
import { menuIcon } from '../../shared/menuIcons';
import { Badge, Button, Card, EmptyMessage, RowMenu, Skeleton, Toggle } from '../../shared/ui';
import admin from '../admin/Admin.module.css';

const PAGE_SIZE = 10;

/** Why a product can or cannot be ordered right now (Core: active && available && category active). */
function orderableLabel(item, categoryActive) {
  if (item.orderable) return { ok: true, text: 'Da' };
  if (!item.active) return { ok: false, text: 'Nu · inactiv' };
  if (!categoryActive) return { ok: false, text: 'Nu · categorie inactivă' };
  return { ok: false, text: 'Nu · epuizat' };
}

/** 1h — products table with category chips, search, availability toggle and pagination. */
export function ProductsTab({ items, categories, onEdit }) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const { run, pending } = useAction();

  if (items.loading && !items.data) return <TableSkeleton />;
  if (items.error && !items.data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Coffee} title="Nu am putut încărca produsele" action={<Button variant="secondary" onClick={items.refetch}>Reîncearcă</Button>}>
          {items.error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const all = items.data;
  const categoryActive = new Map(categories.map((c) => [c.id, c.active]));
  const needle = query.trim().toLocaleLowerCase('ro');
  const filtered = all
    .filter((i) => category === 'all' || i.categoryId === category)
    .filter((i) => !needle || i.name.toLocaleLowerCase('ro').includes(needle) || (i.description ?? '').toLocaleLowerCase('ro').includes(needle));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  const setAvailable = (item, available) =>
    run(`avail-${item.id}`, () => apiRequest(`/api/admin/menu-items/${item.id}/availability`, { method: 'PATCH', body: { available } }), {
      success: available ? `${item.name} este din nou disponibil.` : `${item.name} a fost marcat ca epuizat.`,
      after: items.refetch,
    });
  const setActive = (item, active) =>
    run(`active-${item.id}`, () => apiRequest(`/api/admin/menu-items/${item.id}/status`, { method: 'PATCH', body: { active } }), {
      success: active ? `${item.name} a fost activat.` : `${item.name} a fost dezactivat. Nu mai apare în meniul clienților.`,
      after: items.refetch,
    });

  return (
    <>
      <div className={admin.toolbar}>
        <button
          type="button"
          className={`${admin.chip} ${category === 'all' ? admin.chipOn : ''}`}
          aria-pressed={category === 'all'}
          onClick={() => changeFilter(setCategory)('all')}
        >
          Toate <span className={admin.chipCount}>{all.length}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${admin.chip} ${category === c.id ? admin.chipOn : ''}`}
            aria-pressed={category === c.id}
            onClick={() => changeFilter(setCategory)(c.id)}
          >
            {c.name} <span className={admin.chipCount}>{all.filter((i) => i.categoryId === c.id).length}</span>
          </button>
        ))}
        <label className={admin.search}>
          <Search size={16} aria-hidden />
          <input
            type="search"
            placeholder="Caută produs…"
            aria-label="Caută produs"
            value={query}
            onChange={(e) => changeFilter(setQuery)(e.target.value)}
          />
        </label>
      </div>

      {all.length === 0 ? (
        <Card size="lg">
          <EmptyMessage icon={Coffee} title="Niciun produs în meniu">
            Adaugă întâi o categorie (ex. Băuturi calde), apoi produsele ei.
          </EmptyMessage>
        </Card>
      ) : (
        <div className={admin.tableCard}>
          <table className={admin.table}>
            <thead>
              <tr>
                <th>Produs</th>
                <th>Categorie</th>
                <th>Preț</th>
                <th>Disponibilitate</th>
                <th>Stare</th>
                <th>Comandabil</th>
                <th className={admin.actionsCell}>
                  <span hidden>Acțiuni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const Icon = menuIcon(item.icon);
                const orderable = orderableLabel(item, categoryActive.get(item.categoryId) ?? true);
                return (
                  <tr key={item.id} className={item.active ? '' : admin.rowInactive}>
                    <td>
                      <div className={admin.nameCell}>
                        <span className={admin.thumb} aria-hidden>
                          <Icon size={18} />
                        </span>
                        <div>
                          <div className={item.active ? admin.strong : ''}>{item.name}</div>
                          {item.description && <div className={admin.small}>{item.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{item.categoryName}</td>
                    <td className={admin.strong}>{formatMoney(item.price)}</td>
                    <td>
                      {item.active ? (
                        <span className={admin.nameCell}>
                          <Toggle
                            checked={item.available}
                            disabled={pending === `avail-${item.id}`}
                            ariaLabel={`Disponibilitate ${item.name}`}
                            onChange={(next) => setAvailable(item, next)}
                          />
                          {item.available ? 'Disponibil' : 'Epuizat temporar'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{item.active ? <Badge tone="success">Activ</Badge> : <Badge tone="neutral">Inactiv</Badge>}</td>
                    <td>
                      <span className={orderable.ok ? admin.yes : admin.no}>
                        {orderable.ok ? <CircleCheck size={16} aria-hidden /> : <CircleMinus size={16} aria-hidden />}
                        {orderable.text}
                      </span>
                    </td>
                    <td className={admin.actionsCell}>
                      <div className={admin.rowActions}>
                        <button type="button" className={admin.iconButton} aria-label={`Editează ${item.name}`} onClick={() => onEdit(item)}>
                          <Pencil size={16} />
                        </button>
                        <RowMenu
                          label={`Mai multe acțiuni pentru ${item.name}`}
                          items={[
                            item.active
                              ? { label: 'Dezactivează produsul', tone: 'danger', onSelect: () => setActive(item, false) }
                              : { label: 'Activează produsul', onSelect: () => setActive(item, true) },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className={admin.muted}>
                    Niciun produs nu se potrivește filtrului.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className={admin.tableFoot}>
            <span>
              {visible.length} din {filtered.length} produse
            </span>
            <button type="button" className={admin.iconButton} disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Pagina anterioară">
              <ChevronLeft size={16} />
            </button>
            <button type="button" className={admin.iconButton} disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Pagina următoare">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function TableSkeleton() {
  return (
    <div className={admin.tableCard}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={admin.skeletonRow} style={{ opacity: i < 3 ? 1 : 0.6 }}>
          <Skeleton width={38} height={38} style={{ borderRadius: 999 }} />
          <Skeleton width="25%" height={14} />
          <Skeleton width="15%" height={14} tone={2} />
          <Skeleton width="10%" height={14} tone={2} />
        </div>
      ))}
    </div>
  );
}
