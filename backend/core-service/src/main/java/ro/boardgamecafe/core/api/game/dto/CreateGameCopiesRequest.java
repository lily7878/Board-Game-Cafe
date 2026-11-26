package ro.boardgamecafe.core.api.game.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import ro.boardgamecafe.core.domain.game.CopyCondition;

/**
 * Adds several physical copies of one game at once. Inventory codes are generated as PREFIX-NN, continuing
 * after the highest existing number. codePrefix is optional (default: first letters of the title);
 * conditionStatus defaults to USABLE.
 */
public record CreateGameCopiesRequest(
        @NotNull @Min(1) @Max(20) Integer quantity,
        @Pattern(regexp = "^[A-Za-z0-9]{1,10}$", message = "must have 1-10 letters or digits") String codePrefix,
        CopyCondition conditionStatus,
        @Size(max = 500) String notes
) {}
