import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Dices, QrCode, User } from 'lucide-react';
import { useParticipant } from '../../app/ParticipantContext';
import { useNavigate } from '../../app/router';
import { apiRequest } from '../../shared/api/http';
import { tableLabel } from '../../shared/format';
import { Button, Input, Skeleton } from '../../shared/ui';
import { AccessEndedPage } from '../ended/AccessEndedPage';
import styles from './Join.module.css';

const PIN_LENGTH = 4;

/**
 * 3a — /join/:token. No account: QR token (from the link) + 4-digit PIN (said by staff) + a name.
 * The table number is shown before the PIN (join-info), so customers know they scanned the right
 * table; an unknown/closed token goes straight to the 4n screen.
 */
export function JoinPage({ joinToken }) {
  const { join } = useParticipant();
  const navigate = useNavigate();
  const [info, setInfo] = useState({ loading: true, tableNumber: null, invalid: false });
  const [pin, setPin] = useState(Array(PIN_LENGTH).fill(''));
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const cells = useRef([]);

  useEffect(() => {
    let cancelled = false;
    apiRequest('/api/participant/sessions/join-info', { method: 'POST', auth: false, body: { joinToken } })
      .then((data) => !cancelled && setInfo({ loading: false, tableNumber: data.tableNumber, invalid: false }))
      .catch((error) => {
        if (cancelled) return;
        // 404/400: unknown or closed table. Network problems still let the customer try the PIN.
        const invalid = error.status === 404 || error.status === 400;
        setInfo({ loading: false, tableNumber: null, invalid });
      });
    return () => {
      cancelled = true;
    };
  }, [joinToken]);

  if (info.invalid) return <AccessEndedPage reason="invalid" />;

  const setDigit = (index, value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      // Pasted or autofilled: spread the digits over the cells.
      const next = [...pin];
      digits.slice(0, PIN_LENGTH - index).split('').forEach((d, i) => (next[index + i] = d));
      setPin(next);
      cells.current[Math.min(index + digits.length, PIN_LENGTH - 1)]?.focus();
      return;
    }
    const next = [...pin];
    next[index] = digits;
    setPin(next);
    if (digits && index < PIN_LENGTH - 1) cells.current[index + 1]?.focus();
  };

  const onKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !pin[index] && index > 0) cells.current[index - 1]?.focus();
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const code = pin.join('');
    const next = {};
    if (code.length !== PIN_LENGTH) next.pin = 'Introdu cele 4 cifre ale PIN-ului.';
    if (!name.trim()) next.name = 'Scrie cum să te strigăm.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await join({ joinToken, pin: code, displayName: name.trim(), tableNumber: info.tableNumber });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setSubmitting(false);
      if (error.status === 401) {
        setErrors({ pin: 'PIN greșit. Verifică-l cu personalul.' });
        setPin(Array(PIN_LENGTH).fill(''));
        cells.current[0]?.focus();
      } else if (error.status === 429) {
        setFormError('Prea multe încercări greșite. Așteaptă puțin sau cere ajutorul personalului.');
      } else if (error.isUncertain || error.kind === 'network') {
        setFormError('Nu am primit răspuns. Verifică conexiunea și încearcă din nou.');
      } else {
        setFormError('Nu ai putut intra la masă. Cere ajutorul personalului.');
      }
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>
          <Dices size={22} />
        </span>
        Board Game Café
      </div>

      <div>
        {info.loading ? (
          <Skeleton width={96} height={32} style={{ borderRadius: 999 }} />
        ) : (
          info.tableNumber != null && (
            <span className={styles.tableBadge}>
              <QrCode size={15} aria-hidden /> Masa {tableLabel(info.tableNumber)}
            </span>
          )
        )}
        <h1 className={styles.title}>Intră la masă</h1>
        <p className={styles.lead}>Introdu PIN-ul primit de la personal și numele tău.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <fieldset className={styles.pinField}>
          <legend className={styles.label}>PIN</legend>
          <div className={styles.pinCells}>
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (cells.current[index] = el)}
                className={`${styles.cell} ${errors.pin ? styles.cellInvalid : ''}`}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={index === 0 ? PIN_LENGTH : 1}
                aria-label={`Cifra ${index + 1} din ${PIN_LENGTH}`}
                value={digit}
                onChange={(e) => setDigit(index, e.target.value)}
                onKeyDown={(e) => onKeyDown(index, e)}
                autoFocus={index === 0}
              />
            ))}
          </div>
          {errors.pin && <p className={styles.error}>{errors.pin}</p>}
        </fieldset>

        <Input label="Cum te strigăm?" icon={User} placeholder="Numele tău" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="given-name" />

        {formError && (
          <div className={styles.formError} role="alert">
            {formError}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth iconRight={ArrowRight} submitting={submitting}>
          Intră la masă
        </Button>
        <p className={styles.note}>Nu ai nevoie de cont. Numele e vizibil doar celor de la masă și personalului.</p>
      </form>
    </div>
  );
}
