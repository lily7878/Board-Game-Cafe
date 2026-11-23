import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { tableLabel } from '../../shared/format';
import { Button, Input, Modal, Stepper, Tabs, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { CONDITIONS, defaultCodePrefix, previewCodes } from './gameModel';
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

const MAX_BATCH = 20;
const MODES = [
  { value: 'one', label: 'Un exemplar' },
  { value: 'many', label: 'Mai multe' },
];

/**
 * Add physical copies. "Un exemplar": the manager types the inventory code (unique across all games).
 * "Mai multe": 1–20 copies at once; Core generates the codes PREFIX-NN after the highest number in use.
 *   copies: the copies already loaded on the page, used only to preview the generated codes.
 */
export function CopyFormModal({ games, gameId, copies, onClose, onSaved }) {
  const toast = useToast();
  const activeGames = games.filter((g) => g.active || g.id === gameId);
  const [selected, setSelected] = useState(gameId ?? activeGames[0]?.id ?? '');
  const [mode, setMode] = useState('one');
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState(2);
  const [prefix, setPrefix] = useState('');
  const [condition, setCondition] = useState('USABLE');
  const [notes, setNotes] = useState('');
  const [codeError, setCodeError] = useState(null);
  const [prefixError, setPrefixError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedGame = games.find((g) => String(g.id) === String(selected));
  const effectivePrefix = prefix.trim().toUpperCase() || defaultCodePrefix(selectedGame?.title);
  const preview = copies
    ? previewCodes(effectivePrefix, copies.map((c) => c.inventoryCode), quantity)
    : null;

  async function submitOne() {
    if (!code.trim()) return setCodeError('Scrie codul de inventar, de ex. CAT-03.');
    setCodeError(null);
    await apiRequest(`/api/admin/games/${selected}/copies`, {
      method: 'POST',
      body: { inventoryCode: code.trim().toUpperCase(), conditionStatus: condition, notes: notes.trim() || null },
    });
    toast.success(`Exemplarul ${code.trim().toUpperCase()} a fost adăugat.`);
    return true;
  }

  async function submitMany() {
    if (prefix.trim() && !/^[A-Za-z0-9]{1,10}$/.test(prefix.trim()))
      return setPrefixError('Folosește 1–10 litere sau cifre, fără spații (ex. CAT).');
    setPrefixError(null);
    const created = await apiRequest(`/api/admin/games/${selected}/copies/batch`, {
      method: 'POST',
      body: { quantity, codePrefix: prefix.trim() || null, conditionStatus: condition, notes: notes.trim() || null },
    });
    const codes = created.map((c) => c.inventoryCode);
    toast.success(
      codes.length === 1
        ? `Exemplarul ${codes[0]} a fost adăugat.`
        : `Au fost adăugate ${codes.length} exemplare: ${codes[0]} – ${codes[codes.length - 1]}.`,
    );
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const done = mode === 'one' ? await submitOne() : await submitMany();
      if (!done) return setSubmitting(false);
      onSaved();
      onClose();
    } catch (error) {
      setSubmitting(false);
      if (error.isConflict && mode === 'one') setCodeError('Există deja un exemplar cu acest cod.');
      else if (error.isConflict) setPrefixError('Unele coduri există deja la alt joc. Alege alt prefix.');
      else if (error.isUncertain) setFormError('Serverul nu a confirmat salvarea. Verifică lista înainte să încerci din nou.');
      else setFormError(error.detail ?? 'Exemplarele nu au putut fi adăugate.');
    }
  }

  return (
    <Modal open onClose={submitting ? undefined : onClose} title="Adaugă exemplare" width={520}>
      <form className={admin.form} onSubmit={handleSubmit} noValidate>
        <Tabs tabs={MODES} value={mode} onChange={setMode} stretch ariaLabel="Câte exemplare adaugi" />
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
        {mode === 'one' ? (
          <Input label="Cod de inventar" placeholder="ex. CAT-03" value={code} maxLength={255} onChange={(e) => setCode(e.target.value)} error={codeError} autoFocus />
        ) : (
          <>
            <div className={admin.field}>
              <span className={admin.fieldLabel}>Câte exemplare</span>
              <Stepper value={quantity} onChange={setQuantity} min={1} max={MAX_BATCH} label="Număr de exemplare" />
            </div>
            <Input
              label="Prefix cod (opțional)"
              placeholder={defaultCodePrefix(selectedGame?.title)}
              value={prefix}
              maxLength={10}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              error={prefixError}
            />
            <p className={admin.small}>
              {preview
                ? `Se vor crea: ${preview.length > 4 ? `${preview.slice(0, 3).join(', ')} … ${preview[preview.length - 1]}` : preview.join(', ')}.`
                : `Codurile se generează automat: ${effectivePrefix}-01, ${effectivePrefix}-02…`}
            </p>
          </>
        )}
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
            {mode === 'one' ? 'Adaugă exemplarul' : `Adaugă ${quantity} ${quantity === 1 ? 'exemplar' : 'exemplare'}`}
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
