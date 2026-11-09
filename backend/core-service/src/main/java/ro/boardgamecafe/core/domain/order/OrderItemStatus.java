package ro.boardgamecafe.core.domain.order;

/** Staff decision for one line; distinct from the preparation status of the whole order. */
public enum OrderItemStatus {
    PENDING,
    ACCEPTED,
    REJECTED
}
