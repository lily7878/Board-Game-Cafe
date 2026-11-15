import { useCallback, useState } from 'react';
import { describeError } from '../api/errors';
import { useToast } from '../ui';

/**
 * Runs one staff action (a REST mutation) at a time and reports the outcome.
 *
 *   const { run, pending } = useAction();
 *   run('reserve-7', () => apiRequest(...), { success: 'Joc rezervat.', after: refetch });
 *
 *  - `pending` is the key of the running action -> only that button shows a spinner
 *  - success toast only AFTER Core answered (never optimistic)
 *  - on error: toast + `after` still runs, because after a 409 the screen must refetch
 *  - never retried automatically (a timeout may mean the action WAS applied)
 * Resolves to the response, or undefined when it failed.
 */
export function useAction() {
  const toast = useToast();
  const [pending, setPending] = useState(null);

  const run = useCallback(
    async (key, action, { success, after } = {}) => {
      setPending(key);
      try {
        const result = await action();
        if (success) toast.success(success);
        return result;
      } catch (error) {
        toast.error(describeError(error));
        return undefined;
      } finally {
        setPending(null);
        after?.();
      }
    },
    [toast],
  );

  return { run, pending };
}
