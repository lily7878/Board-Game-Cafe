package ro.boardgamecafe.core.api.menu.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Response bodies for the menu: administrative views and the participant menu. */
public final class MenuResponses {
    private MenuResponses() {
    }

    public record Category(Long id, String name, String description, boolean active, int sortOrder,
            long productCount) {}

    public record Item(Long id, Long categoryId, String categoryName, String name, String description,
            BigDecimal price, boolean available, boolean active, boolean orderable, Instant createdAt,
            String icon, List<String> tags) {}

    /** Participant menu: only orderable products, grouped by active category in the manager's order. */
    public record PublicCategory(Long id, String name, String description, List<PublicItem> items) {}

    public record PublicItem(Long id, String name, String description, BigDecimal price, String icon,
            List<String> tags) {}
}
