package ro.boardgamecafe.core.api.game.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import ro.boardgamecafe.core.domain.game.CopyCondition;

public record CreateGameCopyRequest(
        @NotBlank @Size(max = 255) String inventoryCode,
        @NotNull CopyCondition conditionStatus,
        String notes
) {}
