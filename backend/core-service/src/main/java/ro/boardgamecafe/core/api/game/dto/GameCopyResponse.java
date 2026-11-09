package ro.boardgamecafe.core.api.game.dto;

import java.time.Instant;
import ro.boardgamecafe.core.domain.game.CopyCondition;

public record GameCopyResponse(
        Long id,
        Long gameId,
        String inventoryCode,
        CopyCondition conditionStatus,
        String notes,
        Instant createdAt
) {}
