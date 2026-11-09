package ro.boardgamecafe.core.domain.order;

/** PLACED → ACCEPTED → PREPARING → READY → DELIVERED; PLACED → CANCELLED. */
public enum OrderStatus {
    PLACED,
    ACCEPTED,
    PREPARING,
    READY,
    DELIVERED,
    CANCELLED;

    /** The only status that may follow this one in the kitchen flow, or null if none. */
    public OrderStatus nextInPreparation() {
        return switch (this) {
            case ACCEPTED -> PREPARING;
            case PREPARING -> READY;
            case READY -> DELIVERED;
            default -> null;
        };
    }
}
