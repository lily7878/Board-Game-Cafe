import { useState } from 'react';
import { Info, Settings } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { formatMoney, plural } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, Card, EmptyMessage, Input, Skeleton, Stepper, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import styles from './Settings.module.css';

const toText = (amount) => Number(amount).toFixed(2).replace('.', ',');

/**
 * 2o — cafe name, access fee and game limit (one PUT with all three).
 * The access fee is fixed on each session when the table is OPENED, so a new price only
 * affects tables opened after saving; the warning says how many open sessions keep the old one.
 */
export function GeneralSettingsTab({ query }) {
  const { data, loading, error, refetch } = query;
  const tables = useApiQuery('/api/admin/tables/overview');
  const toast = useToast();

  const [cafeName, setCafeName] = useState(data?.cafeName ?? '');
  const [fee, setFee] = useState(data ? toText(data.accessFeePrice) : '');
  const [limit, setLimit] = useState(data?.maxDeliveredGamesPerTable ?? 3);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading && !data) {
    return (
      <Card size="lg" className={styles.card}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="100%" height={48} />
        <Skeleton width="40%" height={48} tone={2} />
      </Card>
    );
  }
  if (error && !data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Settings} title="Nu am putut încărca setările" action={<Button variant="secondary" onClick={refetch}>Reîncearcă</Button>}>
          {error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const normalizedFee = fee.trim().replace(',', '.');
  const parsedFee = /^\d{1,8}(\.\d{1,2})?$/.test(normalizedFee) ? Number(normalizedFee) : null;
  const feeChanged = parsedFee != null && parsedFee !== Number(data.accessFeePrice);
  const dirty = cafeName.trim() !== data.cafeName || feeChanged || limit !== data.maxDeliveredGamesPerTable;
  const openSessions = (tables.data ?? []).filter((t) => t.session).length;

  const reset = () => {
    setCafeName(data.cafeName);
    setFee(toText(data.accessFeePrice));
    setLimit(data.maxDeliveredGamesPerTable);
    setErrors({});
    setFormError(null);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!cafeName.trim()) next.cafeName = 'Scrie numele cafenelei.';
    if (parsedFee == null) next.fee = 'Introdu un tarif valid, de ex. 10,00 (0 = acces gratuit).';
    setErrors(next);
    if (Object.keys(next).length) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: { cafeName: cafeName.trim(), accessFeePrice: parsedFee, maxDeliveredGamesPerTable: limit },
      });
      toast.success('Setările au fost salvate.');
      refetch(); // new updatedAt -> the form re-initialises from Core
    } catch (err) {
      setSubmitting(false);
      if (err.isUncertain) {
        setFormError('Serverul nu a confirmat salvarea. Reîncarcă pagina și verifică valorile înainte să încerci din nou.');
      } else {
        setFormError(err.detail ?? 'Setările nu au putut fi salvate.');
      }
    }
  }

  return (
    <Card size="lg" className={styles.card}>
      <form className={admin.form} onSubmit={handleSubmit} noValidate>
        <Input label="Numele cafenelei" value={cafeName} maxLength={100} onChange={(e) => setCafeName(e.target.value)} error={errors.cafeName} />

        <div className={admin.field}>
          <div className={styles.feeRow}>
            <Input
              label="Tarif de acces per persoană"
              className={styles.feeInput}
              inputMode="decimal"
              suffix="lei"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              error={errors.fee}
            />
            <span className={styles.current}>acum: {formatMoney(data.accessFeePrice)}</span>
          </div>
          {feeChanged && (
            <p className={styles.warning}>
              <Info size={16} aria-hidden />
              Se aplică doar meselor deschise după salvare.
              {openSessions > 0 &&
                ` ${openSessions === 1 ? 'Sesiunea deschisă rămâne' : `Cele ${plural(openSessions, 'sesiune deschisă', 'sesiuni deschise')} rămân`} la ${formatMoney(data.accessFeePrice)}.`}
            </p>
          )}
        </div>

        <div className={admin.field}>
          <span className={admin.fieldLabel}>Limită de jocuri livrate per masă</span>
          <Stepper value={limit} onChange={setLimit} min={1} max={50} label="Limită de jocuri per masă" />
          <span className={admin.small}>Câte jocuri poate avea o masă în același timp.</span>
        </div>

        {formError && <div className={admin.formError} role="alert">{formError}</div>}

        <div className={admin.formActions}>
          <Button variant="secondary" onClick={reset} disabled={!dirty || submitting}>
            Renunță
          </Button>
          <Button type="submit" submitting={submitting} disabled={!dirty}>
            Salvează modificările
          </Button>
        </div>
      </form>
    </Card>
  );
}
