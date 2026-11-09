package ro.boardgamecafe.core.api.menu.dto;

import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.constraints.*;

/** Request bodies for menu product administration. Prices must be greater than 0. */
public final class MenuItemRequests {
    private MenuItemRequests() {
    }

    /** icon: Lucide icon name (default "coffee"); tags: up to 5 short labels such as "Conține lactoză". */
    public record Create(
            @NotNull Long categoryId,
            @NotBlank @Size(max = 150) String name,
            @Size(max = 2000) String description,
            @NotNull @DecimalMin(value = "0.00", inclusive = false) @Digits(integer = 8, fraction = 2) BigDecimal price,
            @Size(max = 40) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$") String icon,
            @Size(max = 5) List<@NotBlank @Size(max = 30) String> tags) {}

    /** Partial update: null fields are left unchanged; an empty tag list removes all tags. */
    public record Update(
            Long categoryId,
            @Size(min = 1, max = 150) String name,
            @Size(max = 2000) String description,
            @DecimalMin(value = "0.00", inclusive = false) @Digits(integer = 8, fraction = 2) BigDecimal price,
            @Size(max = 40) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$") String icon,
            @Size(max = 5) List<@NotBlank @Size(max = 30) String> tags) {}

    public record ChangeActive(@NotNull Boolean active) {}

    public record ChangeAvailability(@NotNull Boolean available) {}
}
