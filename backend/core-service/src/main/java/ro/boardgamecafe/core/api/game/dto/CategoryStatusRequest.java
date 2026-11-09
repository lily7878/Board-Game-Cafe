package ro.boardgamecafe.core.api.game.dto;

import jakarta.validation.constraints.NotNull;

public record CategoryStatusRequest(@NotNull Boolean active) {}
