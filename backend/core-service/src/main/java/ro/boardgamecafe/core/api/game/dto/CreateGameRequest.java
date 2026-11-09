package ro.boardgamecafe.core.api.game.dto;

import java.util.Set;

import jakarta.validation.constraints.*;
import ro.boardgamecafe.core.domain.game.GameDifficulty;

public record CreateGameRequest(
                @NotBlank @Size(max = 150) String title,
                @NotBlank String description,
                String shortRules,
                @NotNull @Min(1) Integer minPlayers,
                @NotNull @Min(1) Integer maxPlayers,
                @NotNull @Positive Integer durationMinutes,
                @NotNull @Min(0) Integer minimumAge,
                @NotNull GameDifficulty difficulty,
                Set<Long> categoryIds) {
}