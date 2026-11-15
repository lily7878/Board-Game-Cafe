import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from '../../app/router';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, Tabs } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { CategoriesTab } from './CategoriesTab';
import { CategoryFormModal } from './CategoryFormModal';
import { ProductFormModal } from './ProductFormModal';
import { ProductsTab } from './ProductsTab';

/**
 * 1h / 7b — Meniu. Products and categories share the two queries so the tab counters, the
 * category chips and the product form's category list always agree.
 * The tab lives in the URL (?tab=categories); the open form is local state.
 */
export function MenuAdminPage() {
  const params = useSearchParams();
  const navigate = useNavigate();
  const tab = params.get('tab') === 'categories' ? 'categories' : 'products';

  const items = useApiQuery('/api/admin/menu-items');
  const categories = useApiQuery('/api/admin/menu-categories');
  const refetchAll = () => {
    items.refetch();
    categories.refetch();
  };

  // { kind: 'product' | 'category', record?: existing one when editing }
  const [form, setForm] = useState(null);

  return (
    <>
      <div className={admin.header}>
        <Tabs
          surface="tinted"
          ariaLabel="Secțiuni meniu"
          value={tab}
          onChange={(next) => navigate(next === 'categories' ? '/admin/menu?tab=categories' : '/admin/menu', { replace: true })}
          tabs={[
            { value: 'products', label: 'Produse', count: items.data?.length },
            { value: 'categories', label: 'Categorii', count: categories.data?.length },
          ]}
        />
        <div className={admin.headerEnd}>
          <Button iconLeft={Plus} onClick={() => setForm({ kind: tab === 'categories' ? 'category' : 'product' })}>
            {tab === 'categories' ? 'Adaugă categorie' : 'Adaugă produs'}
          </Button>
        </div>
      </div>

      {tab === 'products' ? (
        <ProductsTab items={items} categories={categories.data ?? []} onEdit={(record) => setForm({ kind: 'product', record })} />
      ) : (
        <CategoriesTab categories={categories} onEdit={(record) => setForm({ kind: 'category', record })} onChanged={refetchAll} />
      )}

      {form?.kind === 'product' && (
        <ProductFormModal
          product={form.record}
          categories={categories.data ?? []}
          onClose={() => setForm(null)}
          onSaved={refetchAll}
        />
      )}
      {form?.kind === 'category' && (
        <CategoryFormModal category={form.record} onClose={() => setForm(null)} onSaved={refetchAll} />
      )}
    </>
  );
}
