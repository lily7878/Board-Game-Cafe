package ro.boardgamecafe.core.api.menu.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.*;

/** Request bodies for menu product administration. */
public final class MenuItemRequests {
    private MenuItemRequests() {
    }

    public record Create(
            @NotNull Long categoryId,
            @NotBlank @Size(max = 150) String name,
            @Size(max = 2000) String description,
            @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal price) {}

    /** Partial update: null fields are left unchanged. */
    public record Update(
            Long categoryId,
            @Size(min = 1, max = 150) String name,
            @Size(max = 2000) String description,
            @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal price) {}

    public record ChangeActive(@NotNull Boolean active) {}

    public record ChangeAvailability(@NotNull Boolean available) {}
}
