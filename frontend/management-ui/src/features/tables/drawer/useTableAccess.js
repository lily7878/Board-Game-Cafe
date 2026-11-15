import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useApiQuery } from '../../../shared/hooks/useApiQuery';

/**
 * Join link for the customer app. Core only returns a random join token + PIN; the QR image
 * is generated here, in the browser.
 *
 * Default host = the host this page was opened on, port 5173. So if staff open the management
 * app at http://192.168.1.20:5174, phones get http://192.168.1.20:5173/join/... which works on
 * the cafe Wi-Fi ("localhost" on a phone would point to the phone itself).
 * Override with VITE_CUSTOMER_APP_URL for a real deployment.
 */
export function customerJoinUrl(joinToken) {
  const base = import.meta.env.VITE_CUSTOMER_APP_URL || `${window.location.protocol}//${window.location.hostname}:5173`;
  return `${base.replace(/\/$/, '')}/join/${encodeURIComponent(joinToken)}`;
}

/** QR + PIN of the table's current session (staff only; Core hides it during checkout). */
export function useTableAccess(tableId) {
  const access = useApiQuery(`/api/admin/tables/${tableId}/sessions/current/access`);
  const [qr, setQr] = useState(null);
  const url = access.data ? customerJoinUrl(access.data.joinToken) : null;

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 1, width: 880, errorCorrectionLevel: 'M', color: { dark: '#2E211B', light: '#FFFFFF' } })
      .then((dataUrl) => !cancelled && setQr(dataUrl))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { pin: access.data?.pin, url, qr, loading: access.loading && !access.data, error: access.error };
}
