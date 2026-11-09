package ro.boardgamecafe.core.api.game.dto;

import java.time.Instant;
import java.util.Set;

import ro.boardgamecafe.core.domain.game.GameDifficulty;

public record GameResponse(
                Long id,
                String title,
                String description,
                String shortRules,
                Integer minPlayers,
                Integer maxPlayers,
                Integer durationMinutes,
                Integer minimumAge,
                GameDifficulty difficulty,
                Boolean active,
                Instant createdAt,
                Set<Long> categoryIds) {
}
