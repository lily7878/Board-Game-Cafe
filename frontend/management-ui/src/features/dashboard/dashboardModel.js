import { GAME_REQUEST_STATUS, ORDER_STATUS, SESSION_STATUS } from '../../shared/statuses';
import { plural, tableLabel } from '../../shared/format';

/**
 * Pure functions: Core responses in -> numbers and lists for the dashboard out.
 * No React here, so the rules are easy to read and to unit-test.
 */

// Instants may have a variable number of fractional digits, so never compare them as strings.
const toMs = (iso) => new Date(iso).getTime();

const IN_PROGRESS = new Set(['ACCEPTED', 'PREPARING', 'READY']);

export function summarizeTables(overview = []) {
  const tables = overview.filter((t) => t.active);
  const occupied = tables.filter((t) => t.session);
  const checkout = occupied.filter((t) => t.session.status === 'CHECKOUT_PENDING');
  return { total: tables.length, occupied: occupied.length, free: tables.length - occupied.length, checkout };
}

export function summarizeOrders(orders = []) {
  const fresh = orders.filter((o) => o.status === 'PLACED').sort((a, b) => toMs(a.placedAt) - toMs(b.placedAt));
  return { fresh, inProgress: orders.filter((o) => IN_PROGRESS.has(o.status)).length };
}

export function summarizeRequests(requests = []) {
  return {
    waiting: requests.filter((r) => r.status === 'REQUESTED').length,
    reserved: requests.filter((r) => r.status === 'RESERVED').length,
  };
}

/** "Cappuccino ×2 · Brownie ×1" */
export function itemsSummary(order) {
  return order.items.map((item) => `${item.productName} ×${item.quantity}`).join(' · ');
}

/**
 * Checkout sessions that cannot be paid yet: undelivered orders or games still at the table.
 * Returns [{ tableId, tableNumber, reasons: ['1 comandă nelivrată', ...] }]
 */
export function blockedCheckouts(checkoutTables) {
  return checkoutTables
    .map((t) => {
      const reasons = [];
      if (t.session.openOrders > 0) reasons.push(plural(t.session.openOrders, 'comandă nelivrată', 'comenzi nelivrate'));
      if (t.session.gamesAtTable > 0) reasons.push(plural(t.session.gamesAtTable, 'joc nereturnat', 'jocuri nereturnate'));
      return { tableId: t.tableId, tableNumber: t.tableNumber, reasons };
    })
    .filter((alert) => alert.reasons.length > 0);
}

/**
 * "Activitate recentă" is DERIVED FROM CURRENT STATE (spec), not read from a saved log:
 * every order / game request / open session contributes one entry, dated by the timestamp
 * of its current status. Newest first.
 */
export function recentActivity({ orders = [], requests = [], overview = [] }, limit = 7) {
  const entries = [];

  for (const order of orders) {
    const at = {
      PLACED: order.placedAt,
      ACCEPTED: order.acceptedAt,
      PREPARING: order.acceptedAt,
      READY: order.readyAt,
      DELIVERED: order.deliveredAt,
      CANCELLED: order.cancelledAt,
    }[order.status];
    const title = {
      PLACED: 'Comandă nouă',
      ACCEPTED: 'Comandă acceptată',
      PREPARING: 'Comandă în preparare',
      READY: 'Comandă gata',
      DELIVERED: 'Comandă livrată',
      CANCELLED: 'Comandă anulată',
    }[order.status];
    entries.push({
      key: `order-${order.id}`,
      at,
      title: `${title} — Masa ${tableLabel(order.tableNumber)}`,
      detail: plural(order.items.length, 'poziție', 'poziții'),
      status: ORDER_STATUS[order.status],
    });
  }

  for (const request of requests) {
    const at = {
      REQUESTED: request.requestedAt,
      RESERVED: request.reservedAt,
      DELIVERED: request.deliveredAt,
      RETURNED: request.returnedAt,
      REJECTED: request.cancelledAt,
      CANCELLED: request.cancelledAt,
    }[request.status];
    const title = {
      REQUESTED: 'Cerere joc',
      RESERVED: 'Joc rezervat',
      DELIVERED: 'Joc livrat',
      RETURNED: 'Joc returnat',
      REJECTED: 'Cerere respinsă',
      CANCELLED: 'Cerere anulată',
    }[request.status];
    entries.push({
      key: `game-${request.id}`,
      at: at ?? request.requestedAt,
      title: `${title} — Masa ${tableLabel(request.tableNumber)}`,
      detail: request.gameTitle,
      status: GAME_REQUEST_STATUS[request.status],
    });
  }

  for (const table of overview) {
    if (!table.session) continue;
    entries.push({
      key: `session-${table.session.sessionId}`,
      at: table.session.startedAt,
      title: `Masă deschisă — Masa ${tableLabel(table.tableNumber)}`,
      detail: table.session.openedBy ? `de ${table.session.openedBy}` : '',
      status: SESSION_STATUS[table.session.status],
    });
  }

  return entries
    .filter((entry) => entry.at)
    .sort((a, b) => toMs(b.at) - toMs(a.at))
    .slice(0, limit);
}
