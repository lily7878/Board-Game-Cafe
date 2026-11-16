import { Hammer } from 'lucide-react';
import { MobileShell } from '../../app/shell/MobileShell';

/** Screens of the customer app that are not built yet. */
export function PlaceholderPage({ title }) {
  return (
    <MobileShell title={title} back="/dashboard">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 20, borderRadius: 28, background: 'var(--color-white)', fontWeight: 600 }}>
        <Hammer size={22} color="var(--color-deep-rose)" aria-hidden /> Ecranul acesta este în lucru.
      </div>
    </MobileShell>
  );
}
