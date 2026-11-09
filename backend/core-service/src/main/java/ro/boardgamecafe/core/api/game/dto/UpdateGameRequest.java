package ro.boardgamecafe.core.api.game.dto;

import java.util.Set;

import jakarta.validation.constraints.*;
import ro.boardgamecafe.core.domain.game.GameDifficulty;

public record UpdateGameRequest(
                @Size(max = 150) String title,
                String description,
                String shortRules,
                @Min(1) Integer minPlayers,
                @Min(1) Integer maxPlayers,
                @Positive Integer durationMinutes,
                @Min(0) Integer minimumAge,
                GameDifficulty difficulty,
                Set<Long> categoryIds) {
}