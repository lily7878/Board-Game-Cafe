/** Display helpers. The cafe runs on Europe/Bucharest time, whatever the browser's zone is. */

const TIME_ZONE = 'Europe/Bucharest';

const moneyFormat = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const timeFormat = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE });

/** 1248 -> "1.248,00 lei". Amounts come from Core as JSON numbers (BigDecimal). */
export function formatMoney(amount) {
  return `${moneyFormat.format(Number(amount ?? 0))} lei`;
}

/** ISO instant -> "18:42" (cafe time). */
export function formatTime(iso) {
  return iso ? timeFormat.format(new Date(iso)) : '';
}

const secondsFormat = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: TIME_ZONE });

/** ISO instant -> "18:58:12" (cafe time), for payment attempts. */
export function formatTimeSeconds(iso) {
  return iso ? secondsFormat.format(new Date(iso)) : '';
}

/** "10:00:00" (LocalTime from Core) -> "10:00" */
export function formatLocalTime(value) {
  return value ? value.slice(0, 5) : '';
}

/** Whole minutes between an ISO instant and `now` (never negative). */
export function minutesSince(iso, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}

/** "acum 1 min" / "acum 25 min" / "acum 2 h" */
export function formatAgo(iso, now) {
  const minutes = minutesSince(iso, now);
  if (minutes < 1) return 'chiar acum';
  if (minutes < 60) return `acum ${minutes} min`;
  return `acum ${Math.floor(minutes / 60)} h`;
}

/** Elapsed time since an ISO instant as "hh:mm" (session timer on table cards): 72 min -> "01:12". */
export function formatDuration(iso, now = Date.now()) {
  const minutes = minutesSince(iso, now);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Table number with a leading zero, as in the designs: 4 -> "04". */
export function tableLabel(number) {
  return String(number ?? '').padStart(2, '0');
}

/**
 * Romanian plural: plural(1, 'masă', 'mese') -> "1 masă", plural(5, ...) -> "5 mese".
 * From 20 upward Romanian adds "de": "20 de mese".
 */
export function plural(count, one, many) {
  if (count === 1) return `1 ${one}`;
  const lastTwo = count % 100;
  const needsDe = count !== 0 && (lastTwo === 0 || lastTwo >= 20);
  return `${count} ${needsDe ? 'de ' : ''}${many}`;
}

/** Day of week 1 (Monday) .. 7 (Sunday) in cafe time, as used by the opening-hours API. */
export function cafeDayOfWeek(date = new Date()) {
  const name = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TIME_ZONE }).format(date);
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(name) + 1;
}
