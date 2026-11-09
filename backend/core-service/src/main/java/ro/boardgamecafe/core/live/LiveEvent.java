package ro.boardgamecafe.core.live;

import java.time.Instant;

/**
 * A change notification pushed over WebSocket after the database transaction committed. It only says what
 * changed; clients reload the authoritative state through REST. It never carries tokens, PINs or amounts.
 *
 * @param type     for example "order.placed", "game.reserved", "session.checkout-pending"
 * @param sessionId the table session concerned, or null for global events (menu, business day)
 * @param tableId  the table of that session, or null
 * @param entityId the changed entity (order, game request, payment, day...), or null
 * @param status   the new status of that entity when relevant, or null
 */
public record LiveEvent(String type, Long sessionId, Long tableId, Long entityId, String status, Instant at) {}
