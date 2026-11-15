import { useState } from 'react';
import { apiRequest } from '../../shared/api/http';
import { Button, Input, Modal, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import styles from './Staff.module.css';

const ROLES = [
  { value: 'STAFF', label: 'Staff' },
  { value: 'MANAGER', label: 'Manager' },
];

/** 2k "Adaugă cont": the role comes from the account (no role picker at login). */
export function StaffFormModal({ onClose, onSaved }) {
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STAFF');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!fullName.trim()) next.fullName = 'Scrie numele complet.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Introdu o adresă de email validă.';
    // Core counts UTF-8 bytes (bcrypt limit), so diacritics count double toward the 72 maximum.
    const bytes = new TextEncoder().encode(password).length;
    if (password.length < 12) next.password = 'Parola trebuie să aibă cel puțin 12 caractere.';
    else if (bytes > 72) next.password = 'Parola este prea lungă (maximum 72 de octeți).';
    setErrors(next);
    if (Object.keys(next).length) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/admin/staff', {
        method: 'POST',
        body: { fullName: fullName.trim(), email: email.trim(), password, role },
      });
      toast.success(`Contul pentru ${fullName.trim()} a fost creat. Comunică-i parola inițială.`);
      onSaved();
      onClose();
    } catch (error) {
      setSubmitting(false);
      if (error.isConflict) setErrors({ email: 'Există deja un cont cu acest email.' });
      else if (error.isUncertain) {
        setFormError('Serverul nu a confirmat crearea contului. Verifică lista înainte să încerci din nou.');
        onSaved();
      } else setFormError(error.detail ?? 'Contul nu a putut fi creat.');
    }
  }

  return (
    <Modal open onClose={submitting ? undefined : onClose} title="Adaugă cont" width={500}>
      <form className={admin.form} onSubmit={handleSubmit} noValidate>
        <Input label="Nume complet" value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} autoFocus />
        <Input label="Email" type="email" autoComplete="off" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} error={errors.email} />

        <div className={admin.field}>
          <span className={admin.fieldLabel} id="staff-role">
            Rol
          </span>
          <div className={styles.segmented} role="radiogroup" aria-labelledby="staff-role">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={role === r.value}
                className={`${styles.segment} ${role === r.value ? styles.segmentOn : ''}`}
                onClick={() => setRole(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          {role === 'MANAGER' && <span className={admin.small}>Managerul are acces și la Administrare și la Rapoarte.</span>}
        </div>

        <div className={admin.field}>
          <Input label="Parolă inițială" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          {!errors.password && <span className={admin.small} style={{ paddingLeft: 8 }}>Minimum 12 caractere. Colegul o poate schimba după prima autentificare.</span>}
        </div>

        {formError && <div className={admin.formError} role="alert">{formError}</div>}

        <div className={admin.formActions}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Anulează
          </Button>
          <Button type="submit" submitting={submitting}>
            Creează contul
          </Button>
        </div>
      </form>
    </Modal>
  );
}
