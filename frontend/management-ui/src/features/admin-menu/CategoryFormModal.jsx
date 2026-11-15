import { useState } from 'react';
import { apiRequest } from '../../shared/api/http';
import { Button, Input, Modal, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';

/** Add / edit a menu category. A new category goes to the end of the list. */
export function CategoryFormModal({ category, onClose, onSaved }) {
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
      await apiRequest(isEdit ? `/api/admin/menu-categories/${category.id}` : '/api/admin/menu-categories', {
        method: isEdit ? 'PATCH' : 'POST',
        body: { name: name.trim(), description: description.trim() },
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
        <Input label="Nume" value={name} maxLength={100} placeholder="ex. Băuturi calde" onChange={(e) => setName(e.target.value)} error={nameError} autoFocus />
        <div className={admin.field}>
          <label className={admin.fieldLabel} htmlFor="category-description">
            Descriere (opțional)
          </label>
          <textarea
            id="category-description"
            className={admin.textarea}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
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
