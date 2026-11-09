package ro.boardgamecafe.core.api.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import ro.boardgamecafe.core.domain.order.OrderCancellationReason;
import ro.boardgamecafe.core.domain.order.OrderItemStatus;
import ro.boardgamecafe.core.domain.order.OrderStatus;

/** An order with its lines. "total" is preliminary: rejected lines and cancelled orders count as zero. */
public record OrderResponse(Long id, Long sessionId, Integer tableNumber, Long participantId, String participantName,
        OrderStatus status, OrderCancellationReason cancellationReason, BigDecimal total, Instant placedAt,
        Instant acceptedAt, Instant readyAt, Instant deliveredAt, Instant cancelledAt, List<Item> items) {

    public record Item(Long id, Long menuItemId, String productName, int quantity, BigDecimal unitPrice,
            BigDecimal lineTotal, OrderItemStatus status, String rejectionReason) {}
}
