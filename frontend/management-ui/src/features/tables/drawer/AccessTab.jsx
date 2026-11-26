import { ShieldCheck } from 'lucide-react';
import { describeError } from '../../../shared/api/errors';
import { Skeleton } from '../../../shared/ui';
import { useTableAccess } from './useTableAccess';
import styles from './TableDrawer.module.css';

/** 1f — QR + 4-digit PIN. Shown only to authenticated staff, only while the session is ACTIVE. */
export function AccessTab({ table }) {
  const { pin, url, qr, loading, error } = useTableAccess(table.tableId);

  if (error) return <p className={styles.errorBox}>{describeError(error)}</p>;

  return (
    <>
      <div className={styles.access}>
        <div className={styles.qrBox}>
          {qr ? <img src={qr} alt="Cod QR pentru intrarea la masă" className={styles.qr} /> : <Skeleton width={220} height={220} />}
        </div>
        <div className={styles.pinBlock}>
          <div className={styles.overline}>PIN masă</div>
          <div className={styles.pin} aria-label={pin ? `PIN ${pin.split('').join(' ')}` : 'PIN'}>
            {loading || !pin
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} width={56} height={68} />)
              : pin.split('').map((digit, i) => (
                  <span key={i} className={styles.pinDigit}>
                    {digit}
                  </span>
                ))}
          </div>
          {/* <p className={styles.personMeta}>Clientul scanează codul, introduce PIN-ul și un nume pentru a intra la masă.</p> */}
          {url && (
            <a className={styles.joinLink} href={url} target="_blank" rel="noreferrer">
              {url.replace(/\/join\/.+$/, '/join/…')}
            </a>
          )}
        </div>
      </div>
      {/* <p className={styles.infoNote}>
        <ShieldCheck size={18} aria-hidden />
        Vizibil doar pentru personal autentificat. Codul este valabil cât sesiunea este activă și se invalidează la închidere.
      </p> */}
    </>
  );
}
