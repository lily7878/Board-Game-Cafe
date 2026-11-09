package ro.boardgamecafe.core.api.game.dto;

import java.util.Set;
import ro.boardgamecafe.core.domain.game.GameDifficulty;

public record GameCatalogResponse(
        Long id,
        String title,
        String description,
        String shortRules,
        Integer minPlayers,
        Integer maxPlayers,
        Integer durationMinutes,
        Integer minimumAge,
        GameDifficulty difficulty,
        Set<Long> categoryIds,
        long availableCopies,
        boolean available
) {}
