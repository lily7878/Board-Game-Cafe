package ro.boardgamecafe.core.api.game.dto;

import java.util.List;

public record GameCatalogPageResponse(
        List<GameCatalogResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {}
