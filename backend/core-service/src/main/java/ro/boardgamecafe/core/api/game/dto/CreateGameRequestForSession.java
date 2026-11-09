package ro.boardgamecafe.core.api.game.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateGameRequestForSession(@NotNull @Positive Long gameId) {}
