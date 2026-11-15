import { useState } from 'react';
import { Info } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { tableLabel } from '../../shared/format';
import { Button, Input, Modal, Stepper, Toggle, useToast } from '../../shared/ui';
import styles from './TablesAdmin.module.css';

const MAX_CAPACITY = 20;

/**
 * Add / edit a table (7a).
 * Editing may need TWO requests (PATCH details, then PATCH status) because Core exposes them
 * separately. They are not atomic: if the second fails, the first is already saved, so we
 * refetch the list and say exactly what was not saved.
 */
export function TableFormModal({ table, onClose, onSaved }) {
  const isEdit = Boolean(table);
  const hasOpenSession = Boolean(table?.session);
  const toast = useToast();

  const [number, setNumber] = useState(isEdit ? String(table.tableNumber) : '');
  const [capacity, setCapacity] = useState(isEdit ? table.capacity : 4);
  const [active, setActive] = useState(isEdit ? table.active : true);
  const [numberError, setNumberError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const parsed = Number(number);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setNumberError('Introdu un număr întreg pozitiv.');
      return;
    }
    setNumberError(null);
    setFormError(null);
    setSubmitting(true);

    let step = 'details';
    try {
      if (!isEdit) {
        await apiRequest('/api/admin/tables', { method: 'POST', body: { tableNumber: parsed, capacity } });
      } else {
        const changes = {};
        if (parsed !== table.tableNumber) changes.tableNumber = parsed;
        if (capacity !== table.capacity) changes.capacity = capacity;
        if (Object.keys(changes).length) {
          await apiRequest(`/api/admin/tables/${table.tableId}`, { method: 'PATCH', body: changes });
        }
        if (active !== table.active) {
          step = 'status';
          await apiRequest(`/api/admin/tables/${table.tableId}/status`, { method: 'PATCH', body: { active } });
        }
      }
      toast.success(isEdit ? `Masa ${tableLabel(parsed)} a fost salvată.` : `Masa ${tableLabel(parsed)} a fost adăugată.`);
      onSaved();
      onClose();
    } catch (error) {
      setSubmitting(false);
      onSaved(); // resync: part of the change may already be saved
      if (error.isConflict && step === 'details') {
        setNumberError(`Există deja o masă cu numărul ${parsed}.`);
      } else if (error.isConflict && step === 'status') {
        setFormError('Masa are acum o sesiune deschisă, așa că nu poate fi dezactivată. Celelalte modificări au fost salvate.');
      } else if (error.isUncertain) {
        setFormError('Serverul nu a confirmat salvarea. Verifică lista înainte să încerci din nou.');
      } else {
        setFormError(error.detail ?? 'Masa nu a putut fi salvată.');
      }
    }
  }

  return (
    <Modal
      open
      onClose={submitting ? undefined : onClose}
      title={isEdit ? `Editează Masa ${tableLabel(table.tableNumber)}` : 'Adaugă masă'}
      width={460}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label="Număr masă"
          inputMode="numeric"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
          error={numberError}
          autoFocus={!isEdit}
        />

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Locuri</span>
          <Stepper label="Locuri" value={capacity} onChange={setCapacity} min={1} max={MAX_CAPACITY} />
        </div>

        {isEdit && (
          <>
            <Toggle
              size="lg"
              label="Masă activă"
              checked={active}
              onChange={setActive}
              // Deactivating is blocked while a session is open (Core answers 409).
              disabled={hasOpenSession && table.active}
            />
            {hasOpenSession && table.active && (
              <p className={styles.note}>
                <Info size={14} aria-hidden />
                Masa are o sesiune deschisă. O poți dezactiva după ce sesiunea se închide.
              </p>
            )}
          </>
        )}

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Anulează
          </Button>
          <Button type="submit" submitting={submitting}>
            {isEdit ? 'Salvează' : 'Adaugă masa'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
