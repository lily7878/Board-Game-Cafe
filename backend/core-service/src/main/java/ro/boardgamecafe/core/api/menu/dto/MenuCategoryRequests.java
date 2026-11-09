package ro.boardgamecafe.core.api.menu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request bodies for menu category administration. */
public final class MenuCategoryRequests {
    private MenuCategoryRequests() {
    }

    public record Create(@NotBlank @Size(max = 100) String name, @Size(max = 1000) String description) {}

    /** Partial update: null fields are left unchanged. */
    public record Update(@Size(min = 1, max = 100) String name, @Size(max = 1000) String description) {}

    public record ChangeActive(@NotNull Boolean active) {}
}
