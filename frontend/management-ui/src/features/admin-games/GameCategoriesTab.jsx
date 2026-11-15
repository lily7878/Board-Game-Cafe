import { useState } from 'react';
import { Pencil, Tags } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { useAction } from '../../shared/hooks/useAction';
import { Badge, Button, Card, EmptyMessage, Input, Modal, RowMenu, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { TableSkeleton } from '../admin-menu/ProductsTab';

/** 2l — game categories (filters in the customer catalog). Deactivated, never deleted. */
export function GameCategoriesTab({ data, onEdit }) {
  const { categories } = data;
  const { run, pending } = useAction();

  if (categories.loading && !categories.data) return <TableSkeleton />;
  if (categories.error && !categories.data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Tags} title="Nu am putut încărca categoriile" action={<Button variant="secondary" onClick={categories.refetch}>Reîncearcă</Button>}>
          {categories.error.detail}
        </EmptyMessage>
      </Card>
    );
  }
  if (categories.data.length === 0) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Tags} title="Nicio categorie">
          Categoriile (Strategie, Party, Cooperativ…) îi ajută pe clienți să filtreze catalogul.
        </EmptyMessage>
      </Card>
    );
  }

  const list = [...categories.data].sort((a, b) => Number(b.active) - Number(a.active) || Number(b.gameCount) - Number(a.gameCount));
  const setActive = (category, active) =>
    run(`gcat-${category.id}`, () => apiRequest(`/api/admin/game-categories/${category.id}/status`, { method: 'PATCH', body: { active } }), {
      success: active ? `${category.name} a fost reactivată.` : `${category.name} a fost dezactivată.`,
      after: data.refetchAll,
    });

  return (
    <div className={admin.tableCard} style={{ maxWidth: 908 }}>
      <table className={admin.table}>
        <thead>
          <tr>
            <th>Categorie</th>
            <th>Jocuri</th>
            <th>Stare</th>
            <th className={admin.actionsCell}>
              <span hidden>Acțiuni</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((category) => (
            <tr key={category.id} className={category.active ? '' : admin.rowInactive}>
              <td>
                <div className={category.active ? admin.strong : ''}>{category.name}</div>
                {category.description && <div className={admin.small}>{category.description}</div>}
              </td>
              <td>{category.gameCount}</td>
              <td>{category.active ? <Badge tone="success">Activă</Badge> : <Badge tone="neutral">Inactivă</Badge>}</td>
              <td className={admin.actionsCell}>
                <div className={admin.rowActions}>
                  {category.active ? (
                    <>
                      <button type="button" className={admin.iconButton} aria-label={`Editează ${category.name}`} onClick={() => onEdit(category)}>
                        <Pencil size={16} />
                      </button>
                      <RowMenu
                        label={`Mai multe acțiuni pentru ${category.name}`}
                        items={[{ label: 'Dezactivează categoria', tone: 'danger', onSelect: () => setActive(category, false) }]}
                      />
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" submitting={pending === `gcat-${category.id}`} onClick={() => setActive(category, true)}>
                      Reactivează
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GameCategoryModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const toast = useToast();
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [nameError, setNameError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return setNameError('Scrie numele categoriei.');
    setNameError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest(isEdit ? `/api/admin/game-categories/${category.id}` : '/api/admin/game-categories', {
        method: isEdit ? 'PATCH' : 'POST',
        body: { name: name.trim(), description: description.trim() || null },
      });
      toast.success(isEdit ? `Categoria ${name.trim()} a fost salvată.` : `Categoria ${name.trim()} a fost adăugată.`);
      onSaved();
      onClose();
    } catch (error) {
      setSubmitting(false);
      if (error.isConflict) setNameError('Există deja o categorie cu acest nume.');
      else if (error.isUncertain) setFormError('Serverul nu a confirmat salvarea. Verifică lista înainte să încerci din nou.');
      else setFormError(error.detail ?? 'Categoria nu a putut fi salvată.');
    }
  }

  return (
    <Modal open onClose={submitting ? undefined : onClose} title={isEdit ? `Editează ${category.name}` : 'Adaugă categorie'} width={480}>
      <form className={admin.form} onSubmit={handleSubmit} noValidate>
        <Input label="Nume" value={name} maxLength={100} placeholder="ex. Cooperativ" onChange={(e) => setName(e.target.value)} error={nameError} autoFocus />
        <div className={admin.field}>
          <label className={admin.fieldLabel} htmlFor="game-category-description">
            Descriere (opțional)
          </label>
          <textarea id="game-category-description" className={admin.textarea} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {formError && <div className={admin.formError} role="alert">{formError}</div>}
        <div className={admin.formActions}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Anulează
          </Button>
          <Button type="submit" submitting={submitting}>
            {isEdit ? 'Salvează' : 'Adaugă categoria'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
