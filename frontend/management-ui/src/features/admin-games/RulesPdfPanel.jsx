import { useEffect, useRef, useState } from 'react';
import { FileText, RefreshCw, Trash2, Upload } from 'lucide-react';
import { apiRequest } from '../../shared/api/http';
import { useAction } from '../../shared/hooks/useAction';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Badge, Button, Skeleton } from '../../shared/ui';
import styles from './Games.module.css';

const MAX_BYTES = 20 * 1024 * 1024;
const POLL_MS = 3000;
const STATUS = {
  READY: { tone: 'success', label: 'Gata' },
  PROCESSING: { tone: 'warning', label: 'În procesare' },
  FAILED: { tone: 'error', label: 'Eșuat' },
};

function sizeLabel(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * 2n / 7c — the game's PDF manual: state (Gata / În procesare / Eșuat / Încarcă), upload and replace.
 * The AI Service indexes the PDF in the background; while it is processing this panel re-reads the state.
 * A replacement keeps the previous manual in use until the new one is ready.
 */
export function RulesPdfPanel({ gameId }) {
  const rules = useApiQuery(`/api/admin/games/${gameId}/rules`);
  const { run, pending } = useAction();
  const input = useRef(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [localError, setLocalError] = useState(null);

  const latest = rules.data?.latest;
  const processing = latest?.status === 'PROCESSING';
  const refetch = rules.refetch;

  useEffect(() => {
    if (!processing) return undefined;
    const timer = setInterval(refetch, POLL_MS);
    return () => clearInterval(timer);
  }, [processing, refetch]);

  function choose(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setLocalError('Fișierul trebuie să fie un PDF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError('PDF-ul poate avea cel mult 20 MB.');
      return;
    }
    setLocalError(null);
    const form = new FormData();
    form.append('file', file);
    run('upload', () => apiRequest(`/api/admin/games/${gameId}/rules`, { method: 'POST', body: form, timeoutMs: 90000 }), {
      success: 'Manualul a fost încărcat și se procesează.',
      after: refetch,
    });
  }

  function remove() {
    setConfirmRemove(false);
    run('remove', () => apiRequest(`/api/admin/games/${gameId}/rules`, { method: 'DELETE' }), {
      success: 'Manualul a fost scos. Asistentul de reguli nu mai e disponibil pentru acest joc.',
      after: refetch,
    });
  }

  if (rules.loading && !rules.data) return <Skeleton width="100%" height={66} tone={2} />;

  const status = latest ? STATUS[latest.status] : null;
  const uploading = pending === 'upload';

  return (
    <div className={styles.pdfPanel}>
      <div className={styles.pdfRow}>
        <span className={styles.pdfIcon} aria-hidden>
          <FileText size={18} />
        </span>
        <div className={styles.grow}>
          <strong>Reguli PDF</strong>
          {latest ? (
            <div className={styles.muted}>
              {latest.fileName} · {sizeLabel(latest.sizeBytes)}
              {latest.pageCount ? ` · ${latest.pageCount} pagini` : ''}
              {latest.uploadedBy ? ` · încărcat de ${latest.uploadedBy}` : ''}
            </div>
          ) : (
            <div className={styles.muted}>Încarcă manualul jocului, ca asistentul să le poată explica clienților regulile.</div>
          )}
        </div>
        {uploading ? <Badge tone="warning">Se încarcă…</Badge> : status ? <Badge tone={status.tone}>{status.label}</Badge> : <Badge tone="neutral">Fără manual</Badge>}
      </div>

      {processing && <p className={styles.muted} role="status">Serviciul AI citește manualul. Durează de obicei sub un minut; starea se actualizează singură.</p>}
      {latest?.status === 'FAILED' && (
        <p className={styles.pdfError} role="alert">
          {latest.failureReason ?? 'Procesarea a eșuat.'}
          {rules.data.available && ' Clienții folosesc în continuare manualul anterior.'}
        </p>
      )}
      {latest?.status === 'READY' && !latest.active && rules.data.available && <p className={styles.muted}>Clienții folosesc manualul anterior.</p>}
      {localError && (
        <p className={styles.pdfError} role="alert">
          {localError}
        </p>
      )}

      <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={choose} />
      <div className={styles.pdfActions}>
        <Button
          size="sm"
          variant={latest ? 'secondary' : 'primary'}
          iconLeft={latest?.status === 'FAILED' ? RefreshCw : Upload}
          submitting={uploading}
          disabled={processing || Boolean(pending)}
          onClick={() => input.current?.click()}
        >
          {!latest ? 'Încarcă PDF' : latest.status === 'FAILED' ? 'Încarcă din nou' : 'Înlocuiește'}
        </Button>
        {latest &&
          (confirmRemove ? (
            <>
              <Button size="sm" variant="primary" submitting={pending === 'remove'} onClick={remove}>
                Confirmă scoaterea
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(false)}>
                Renunță
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" iconLeft={Trash2} disabled={Boolean(pending)} onClick={() => setConfirmRemove(true)}>
              Scoate manualul
            </Button>
          ))}
      </div>
    </div>
  );
}
