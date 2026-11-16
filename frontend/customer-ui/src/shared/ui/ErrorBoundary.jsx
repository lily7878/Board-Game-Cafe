import { Component } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { EmptyMessage } from './EmptyMessage';

/**
 * Catches render errors of one screen so the rest of the app (sidebar, topbar) keeps working
 * instead of React unmounting everything (white page).
 * Error boundaries must be class components: React has no hook for componentDidCatch.
 * Give it a `key` that changes on navigation so a new page starts with a clean state.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Screen crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Card size="lg">
        <EmptyMessage
          icon={CircleAlert}
          title="Ecranul nu a putut fi afișat"
          action={<Button onClick={() => window.location.reload()}>Reîncarcă pagina</Button>}
        >
          A apărut o eroare neașteptată. Datele tale sunt în siguranță pe server; reîncarcă pagina ca să continui.
        </EmptyMessage>
      </Card>
    );
  }
}
