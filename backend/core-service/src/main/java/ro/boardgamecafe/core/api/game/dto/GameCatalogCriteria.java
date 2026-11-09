package ro.boardgamecafe.core.api.game.dto;

import ro.boardgamecafe.core.domain.game.GameDifficulty;

public record GameCatalogCriteria(
        Long categoryId,
        Integer players,
        Integer maxDurationMinutes,
        Integer age,
        GameDifficulty difficulty,
        boolean availableOnly
) {}
