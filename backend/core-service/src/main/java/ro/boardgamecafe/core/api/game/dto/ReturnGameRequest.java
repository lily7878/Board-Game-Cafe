package ro.boardgamecafe.core.api.game.dto;

import jakarta.validation.constraints.NotNull;
import ro.boardgamecafe.core.domain.game.CopyCondition;

public record ReturnGameRequest(@NotNull CopyCondition conditionStatus) {}
