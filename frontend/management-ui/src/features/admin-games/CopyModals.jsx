import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { tableLabel } from '../../shared/format';
import { Button, Input, Modal, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { CONDITIONS } from './gameModel';
import styles from './Games.module.css';

function ConditionPicker({ value, onChange }) {
  return (
    <div className={styles.conditions} role="radiogroup" aria-label="Starea exemplarului">
      {CONDITIONS.map((c) => (
        <label key={c.value} className={`${styles.condition} ${value === c.value ? styles.conditionOn : ''}`}>
          <input type="radio" name="condition" value={c.value} checked={value === c.value} onChange={() => onChange(c.value)} />
          <span>
            <strong>{c.label}</strong>
            <span className={admin.small}>{c.hint}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

/** Add a physical copy (inventory code must be unique across all games). */
export function CopyFormModal({ games, gameId, onClose, onSaved }) {
  const toast = useToast();
  const activeGames = games.filter((g) => g.active || g.id === gameId);
  const [selected, setSelected] = useState(gameId ?? activeGames[0]?.id ?? '');
  const [code, setCode] = useState('');
  const [condition, setCondition] = useState('USABLE');
  const [notes, setNotes] = useState('');
  const [codeError, setCodeError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!code.trim()) return setCodeError('Scrie codul de inventar, de ex. CAT-03.');
    setCodeError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest(`/api/admin/games/${selected}/copies`, {
        method: 'POST',
        body: { inventoryCode: code.trim().toUpperCase(), conditionStatus: condition, notes: notes.trim() || null },
      });
      toast.success(`Exemplarul ${code.trim().toUpperCase()} a fost adăugat.`);
      onSaved();
      onClose();
    } catch (error) {
      setSubmitting(false);
      if (error.isConflict) setCodeError('Există deja un exemplar cu acest cod.');
      else if (error.isUncertain) setFormError('Serverul nu a confirmat salvarea. Verifică lista înainte să încerci din nou.');
      else setFormError(error.detail ?? 'Exemplarul nu a putut fi adăugat.');
    }
  }

  return (
    <Modal open onClose={submitting ? undefined : onClose} title="Adaugă exemplar" width={500}>
      <form className={admin.form} onSubmit={handleSubmit} noValidate>
        {!gameId && (
          <div className={admin.field}>
            <label className={admin.fieldLabel} htmlFor="copy-game">
              Joc
            </label>
            <div className={admin.select}>
              <select id="copy-game" value={selected} onChange={(e) => setSelected(e.target.value)}>
                {activeGames.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden />
            </div>
          </div>
        )}
        <Input label="Cod de inventar" placeholder="ex. CAT-03" value={code} maxLength={255} onChange={(e) => setCode(e.target.value)} error={codeError} autoFocus />
        <div className={admin.field}>
          <span className={admin.fieldLabel}>Stare</span>
          <ConditionPicker value={condition} onChange={setCondition} />
        </div>
        <Input label="Notă (opțional)" placeholder="ex. Cutie reparată" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {formError && <div className={admin.formError} role="alert">{formError}</div>}
        <div className={admin.formActions}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Anulează
          </Button>
          <Button type="submit" submitting={submitting} disabled={!selected}>
            Adaugă exemplarul
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Change a copy's condition (and note). A copy that is at a table stays there: the new condition
 * applies when it comes back, which is why the modal says so.
 */
export function CopyStatusModal({ copy, onClose, onSaved }) {
  const toast = useToast();
  const [condition, setCondition] = useState(copy.conditionStatus);
  const [notes, setNotes] = useState(copy.notes ?? '');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest(`/api/admin/game-copies/${copy.id}/status`, {
        method: 'PATCH',
        body: { conditionStatus: condition, notes: notes.trim() },
      });
      toast.success(`Starea exemplarului ${copy.inventoryCode} a fost salvată.`);
      onSaved();
      onClose();
    } catch (error) {
      setSubmitting(false);
      setFormError(error.isUncertain ? 'Serverul nu a confirmat salvarea. Verifică lista înainte să încerci din nou.' : (error.detail ?? 'Starea nu a putut fi salvată.'));
    }
  }

  return (
    <Modal open onClose={submitting ? undefined : onClose} title={`Exemplarul ${copy.inventoryCode}`} width={500}>
      <form className={admin.form} onSubmit={handleSubmit} noValidate>
        {copy.activeRequestStatus && (
          <p className={admin.note}>
            Exemplarul este acum la Masa {tableLabel(copy.tableNumber)}. Starea nouă contează pentru următoarele rezervări.
          </p>
        )}
        <ConditionPicker value={condition} onChange={setCondition} />
        <Input label="Notă" placeholder="ex. Lipsesc 3 cărți" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {formError && <div className={admin.formError} role="alert">{formError}</div>}
        <div className={admin.formActions}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Anulează
          </Button>
          <Button type="submit" submitting={submitting}>
            Salvează
          </Button>
        </div>
      </form>
    </Modal>
  );
}
