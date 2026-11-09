package ro.boardgamecafe.core.api.game.dto;

import jakarta.validation.constraints.NotNull;

public record GameStatusRequest(@NotNull Boolean active) {
}
