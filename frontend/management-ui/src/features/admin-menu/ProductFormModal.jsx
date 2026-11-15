import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { MENU_ICON_NAMES, menuIcon } from '../../shared/menuIcons';
import { Button, Input, Modal, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';

/** "12,5" / "12.50" -> 12.5; null when it is not a valid amount with at most 2 decimals. */
function parsePrice(text) {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized)) return null;
  return Number(normalized);
}

/**
 * 7b — add / edit a product. Price must be > 0 (validated here and by Core).
 * Editing sends only the changed fields (Core treats null as "leave unchanged").
 */
export function ProductFormModal({ product, categories, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const toast = useToast();
  const selectable = categories.filter((c) => c.active || c.id === product?.categoryId);

  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? selectable[0]?.id ?? '');
  const [price, setPrice] = useState(product ? String(product.price).replace('.', ',') : '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [icon, setIcon] = useState(product?.icon ?? 'coffee');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const parsed = parsePrice(price);
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = 'Scrie numele produsului.';
    if (!categoryId) nextErrors.category = 'Alege o categorie.';
    if (parsed == null) nextErrors.price = 'Introdu un preț valid, de ex. 16,50.';
    else if (parsed <= 0) nextErrors.price = 'Prețul trebuie să fie mai mare decât 0.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const fields = { categoryId: Number(categoryId), name: name.trim(), description: description.trim(), price: parsed, icon };
    let body = fields;
    if (isEdit) {
      body = Object.fromEntries(
        Object.entries(fields).filter(([key, value]) => (key === 'price' ? Number(product.price) !== value : (product[key] ?? '') !== value)),
      );
      if (Object.keys(body).length === 0) return onClose();
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest(isEdit ? `/api/admin/menu-items/${product.id}` : '/api/admin/menu-items', {
        method: isEdit ? 'PATCH' : 'POST',
        body,
      });
      toast.success(isEdit ? `${fields.name} a fost salvat.` : `${fields.name} a fost adăugat în meniu.`);
      onSaved();
      onClose();
    } catch (error) {
      setSubmitting(false);
      if (error.isUncertain) setFormError('Serverul nu a confirmat salvarea. Verifică lista înainte să încerci din nou.');
      else if (error.isValidation) setFormError('Unele câmpuri nu sunt valide. Verifică prețul și numele.');
      else setFormError(error.detail ?? 'Produsul nu a putut fi salvat.');
      if (error.isUncertain) onSaved();
    }
  }

  return (
    <Modal open onClose={submitting ? undefined : onClose} title={isEdit ? `Editează ${product.name}` : 'Adaugă produs'} width={540}>
      <form className={admin.form} onSubmit={handleSubmit} noValidate>
        <Input label="Nume" value={name} maxLength={150} onChange={(e) => setName(e.target.value)} error={errors.name} autoFocus />

        <div className={admin.row2}>
          <div className={admin.field}>
            <label className={admin.fieldLabel} htmlFor="product-category">
              Categorie
            </label>
            <div className={admin.select}>
              <select id="product-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {selectable.length === 0 && <option value="">Nicio categorie activă</option>}
                {selectable.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.active ? '' : ' (inactivă)'}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden />
            </div>
            {errors.category && <span className={admin.fieldError}>{errors.category}</span>}
          </div>
          <Input label="Preț" inputMode="decimal" placeholder="0,00" suffix="lei" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} />
        </div>

        <div className={admin.field}>
          <label className={admin.fieldLabel} htmlFor="product-description">
            Descriere scurtă
          </label>
          <textarea
            id="product-description"
            className={admin.textarea}
            maxLength={2000}
            placeholder="ex. Espresso, lapte, spumă"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={admin.field}>
          <span className={admin.fieldLabel} id="product-icon">
            Icon
          </span>
          <div className={admin.iconPicker} role="radiogroup" aria-labelledby="product-icon">
            {MENU_ICON_NAMES.map((key) => {
              const Icon = menuIcon(key);
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={icon === key}
                  aria-label={key}
                  className={`${admin.iconOption} ${icon === key ? admin.iconOptionOn : ''}`}
                  onClick={() => setIcon(key)}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
        </div>

        {formError && <div className={admin.formError} role="alert">{formError}</div>}

        <div className={admin.formActions}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Anulează
          </Button>
          <Button type="submit" submitting={submitting} disabled={selectable.length === 0}>
            Salvează produsul
          </Button>
        </div>
      </form>
    </Modal>
  );
}
