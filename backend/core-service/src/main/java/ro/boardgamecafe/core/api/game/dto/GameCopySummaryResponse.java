package ro.boardgamecafe.core.api.game.dto;

public record GameCopySummaryResponse(
        Long gameId,
        long total,
        long usable,
        long underMaintenance,
        long unavailable
) {}
