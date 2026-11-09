package ro.boardgamecafe.core.api.menu.dto;

import java.util.List;
import jakarta.validation.constraints.NotEmpty;
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

    /** The full list of category ids in the desired order (every category exactly once). */
    public record Reorder(@NotEmpty List<@NotNull Long> categoryIds) {}
}
