import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { formatLocalTime } from '../../shared/format';
import { Button, Card, EmptyMessage, Skeleton, Toggle, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import styles from './Settings.module.css';

const DAY_NAMES = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

const fromCore = (h) => ({
  dayOfWeek: h.dayOfWeek,
  closed: h.closed,
  openTime: formatLocalTime(h.openTime) || '10:00',
  closeTime: formatLocalTime(h.closeTime) || '22:00',
});
/** Every 15 minutes, 24-hour format whatever the browser locale (native time inputs show AM/PM in en-US). */
const SLOTS = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`);

function TimeSelect({ value, invalid, ...rest }) {
  const options = SLOTS.includes(value) ? SLOTS : [...SLOTS, value].sort();
  return (
    <select className={`${styles.time} ${invalid ? styles.timeInvalid : ''}`} value={value} {...rest}>
      {options.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

const same = (a, b) => a.closed === b.closed && (a.closed || (a.openTime === b.openTime && a.closeTime === b.closeTime));

/**
 * 2p — weekly opening hours. Purely informative (shown to customers); it does NOT open or
 * close the business day. Core saves one day per request, so only changed days are sent and a
 * partial failure says exactly which days were saved.
 */
export function OpeningHoursTab({ query }) {
  const { data, loading, error, refetch } = query;
  const toast = useToast();
  const original = (data ?? []).map(fromCore).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const [days, setDays] = useState(original);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading && !data) {
    return (
      <Card size="lg" className={styles.card}>
        {DAY_NAMES.map((d) => (
          <Skeleton key={d} width="70%" height={20} style={{ margin: '14px 0' }} />
        ))}
      </Card>
    );
  }
  if (error && !data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={CalendarClock} title="Nu am putut încărca programul" action={<Button variant="secondary" onClick={refetch}>Reîncearcă</Button>}>
          {error.detail}
        </EmptyMessage>
      </Card>
    );
  }

  const invalid = (d) => !d.closed && (!d.openTime || !d.closeTime || d.openTime >= d.closeTime);
  const changed = days.filter((d, i) => !same(d, original[i]));
  const update = (dayOfWeek, patch) => setDays((list) => list.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));

  async function save() {
    if (days.some(invalid)) {
      setFormError('Ora de deschidere trebuie să fie înaintea orei de închidere (programul nu poate trece de miezul nopții).');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    const saved = [];
    try {
      for (const d of changed) {
        await apiRequest(`/api/admin/opening-hours/${d.dayOfWeek}`, {
          method: 'PUT',
          body: d.closed ? { closed: true } : { closed: false, openTime: d.openTime, closeTime: d.closeTime },
        });
        saved.push(DAY_NAMES[d.dayOfWeek - 1]);
      }
      toast.success('Programul a fost salvat.');
    } catch (err) {
      const failed = DAY_NAMES[changed[saved.length].dayOfWeek - 1];
      setFormError(
        `${failed}: ${err.isUncertain ? 'serverul nu a confirmat salvarea' : (err.detail ?? 'nu a putut fi salvat')}.` +
          (saved.length ? ` Zilele ${saved.join(', ')} au fost salvate.` : ''),
      );
      toast.error('Programul a fost salvat doar parțial.');
    } finally {
      setSubmitting(false);
      refetch(); // remounts the tab with what Core actually stored
    }
  }

  return (
    <Card size="lg" className={styles.card}>
      <div className={styles.days}>
        {days.map((d) => (
          <div key={d.dayOfWeek} className={styles.day}>
            <span className={styles.dayName}>{DAY_NAMES[d.dayOfWeek - 1]}</span>
            <span className={styles.dayToggle}>
              <Toggle
                checked={!d.closed}
                disabled={submitting}
                ariaLabel={`${DAY_NAMES[d.dayOfWeek - 1]} deschis`}
                onChange={(open) => update(d.dayOfWeek, { closed: !open })}
              />
              <span className={d.closed ? admin.muted : ''}>{d.closed ? 'Închis' : 'Deschis'}</span>
            </span>
            {d.closed ? (
              <span className={admin.muted}>—</span>
            ) : (
              <span className={styles.times}>
                <TimeSelect
                  value={d.openTime}
                  invalid={invalid(d)}
                  disabled={submitting}
                  aria-label={`${DAY_NAMES[d.dayOfWeek - 1]}: deschidere`}
                  onChange={(e) => update(d.dayOfWeek, { openTime: e.target.value })}
                />
                <span className={admin.muted}>–</span>
                <TimeSelect
                  value={d.closeTime}
                  invalid={invalid(d)}
                  disabled={submitting}
                  aria-label={`${DAY_NAMES[d.dayOfWeek - 1]}: închidere`}
                  onChange={(e) => update(d.dayOfWeek, { closeTime: e.target.value })}
                />
              </span>
            )}
          </div>
        ))}
      </div>

      {formError && <div className={admin.formError} role="alert">{formError}</div>}

      <div className={styles.hoursFoot}>
        <span className={admin.small}>Programul e afișat clienților. Nu deschide și nu închide ziua de business.</span>
        <Button submitting={submitting} disabled={changed.length === 0} onClick={save}>
          Salvează programul
        </Button>
      </div>
    </Card>
  );
}
