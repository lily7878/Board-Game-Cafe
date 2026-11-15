import { Hammer } from 'lucide-react';
import { Card, EmptyMessage } from '../../shared/ui';

/** Temporary page for modules not built yet. Replaced feature by feature. */
export function PlaceholderPage({ title }) {
  return (
    <Card size="lg">
      <EmptyMessage icon={Hammer} title={`${title} — în lucru`}>
        Ecranul acesta urmează să fie construit după machetele din handoff.
      </EmptyMessage>
    </Card>
  );
}
