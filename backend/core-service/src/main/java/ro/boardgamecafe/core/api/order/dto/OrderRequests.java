package ro.boardgamecafe.core.api.order.dto;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import ro.boardgamecafe.core.domain.order.OrderStatus;

/** Request bodies for placing and processing food orders. */
public final class OrderRequests {
    private OrderRequests() {
    }

    public record Line(@NotNull Long menuItemId, @NotNull @Min(1) @Max(99) Integer quantity) {}

    /** Used both to place an order and to replace its lines while it is still PLACED. */
    public record Place(@NotEmpty @Size(max = 30) List<@Valid @NotNull Line> items) {}

    public record ItemDecision(@NotNull Long orderItemId, @NotNull Boolean accepted,
            @Size(max = 500) String rejectionReason) {}

    /** One decision for every line of the order, applied atomically. */
    public record Process(@NotEmpty List<@Valid @NotNull ItemDecision> decisions) {}

    /** Next kitchen step: PREPARING, READY or DELIVERED. */
    public record ChangeStatus(@NotNull OrderStatus status) {}
}
