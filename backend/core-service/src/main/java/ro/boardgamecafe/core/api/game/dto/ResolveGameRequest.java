package ro.boardgamecafe.core.api.game.dto;

import jakarta.validation.constraints.NotBlank;

public record ResolveGameRequest(@NotBlank String reason) {}
