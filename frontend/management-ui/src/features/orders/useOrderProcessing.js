import { useState } from 'react';
import { apiRequest } from '../../shared/api/http';
import { describeError } from '../../shared/api/errors';
import { ORDER_STATUS } from '../../shared/statuses';
import { useToast } from '../../shared/ui';

/**
 * Accept / reject per line for PLACED orders (2g) and the timeout flow (2h).
 *
 * Each order being decided has a draft kept on the page, so collapsing a card keeps the typed
 * reasons and, more importantly, the "result unknown" state:
 *   { decisions: { [itemId]: { accepted, reason } }, showErrors, uncertain, changed }
 *   uncertain: null | 'unknown' (timeout, outcome not known) | 'checked' (verified: still new)
 *
 * After a timeout NOTHING is resent automatically: the request may still be running on the
 * server. Staff press "Verifică starea", which only reads the order; confirming again becomes
 * possible only if Core says the order is still PLACED.
 */
export function useOrderProcessing({ refetch }) {
  const toast = useToast();
  const [drafts, setDrafts] = useState({});
  const [pending, setPending] = useState(null);

  const patch = (order, change) =>
    setDrafts((all) => ({ ...all, [order.id]: { ...mergeDraft(all[order.id], order), ...change } }));
  const drop = (orderId) =>
    setDrafts((all) => {
      const next = { ...all };
      delete next[orderId];
      return next;
    });

  const setDecision = (order, itemId, change) =>
    setDrafts((all) => {
      const draft = mergeDraft(all[order.id], order);
      const decisions = { ...draft.decisions, [itemId]: { ...draft.decisions[itemId], ...change } };
      // Touching a decision means staff have looked at the current lines again.
      return { ...all, [order.id]: { ...draft, decisions, changed: false } };
    });

  /** Sends one decision for every line, in a single request (Core applies them atomically). */
  const confirm = async (order) => {
    const draft = mergeDraft(drafts[order.id], order);
    const lines = order.items.map((item) => ({ item, ...draft.decisions[item.id] }));
    if (lines.some((l) => !l.accepted && !l.reason.trim())) {
      patch(order, { showErrors: true });
      return false;
    }

    setPending(`process-${order.id}`);
    try {
      const result = await apiRequest(`/api/admin/orders/${order.id}/process`, {
        method: 'POST',
        body: {
          decisions: lines.map((l) => ({
            orderItemId: l.item.id,
            accepted: l.accepted,
            rejectionReason: l.accepted ? null : l.reason.trim(),
          })),
        },
      });
      drop(order.id);
      toast.success(
        result?.status === 'CANCELLED'
          ? `Comanda #C-${order.id} a fost anulată: toate pozițiile au fost respinse.`
          : `Comanda #C-${order.id} a fost procesată.`,
      );
      refetch();
      return true;
    } catch (error) {
      if (error.isUncertain) {
        // No refetch either: a read right now could still see the old state while the
        // original request is being applied. "Verifică starea" is a deliberate second step.
        patch(order, { uncertain: 'unknown' });
        toast.error('Rezultatul nu e cunoscut. Verifică starea comenzii.', { title: `Timeout la #C-${order.id}` });
      } else {
        toast.error(
          error.isValidation
            ? 'Comanda s-a modificat între timp. Am reîncărcat-o: verifică pozițiile și confirmă din nou.'
            : describeError(error),
        );
        refetch();
      }
      return false;
    } finally {
      setPending(null);
    }
  };

  /** 2h "Verifică starea": reads the order once and unlocks a new confirmation only if still new. */
  const verify = async (order) => {
    setPending(`verify-${order.id}`);
    try {
      const fresh = await apiRequest(`/api/admin/orders/${order.id}`);
      if (fresh.status === 'PLACED') {
        patch(order, { uncertain: 'checked' });
      } else {
        drop(order.id);
        toast.success(`Comanda #C-${order.id} fusese deja procesată: ${ORDER_STATUS[fresh.status].label.toLowerCase()}.`);
      }
      refetch();
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setPending(null);
    }
  };

  return {
    draftFor: (order) => mergeDraft(drafts[order.id], order),
    setDecision,
    confirm,
    verify,
    pending,
  };
}

/**
 * Lines the customer replaced while staff were deciding get new ids: old decisions are dropped,
 * new lines start as "accept", and `changed` tells the panel to warn about it.
 */
function mergeDraft(saved, order) {
  const decisions = {};
  for (const item of order.items) decisions[item.id] = saved?.decisions[item.id] ?? { accepted: true, reason: '' };
  const changed =
    saved?.changed || Boolean(saved && Object.keys(saved.decisions).some((id) => !order.items.some((i) => String(i.id) === id)));
  return { showErrors: false, uncertain: null, ...saved, decisions, changed };
}
