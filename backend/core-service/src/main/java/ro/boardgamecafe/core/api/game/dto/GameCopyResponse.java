package ro.boardgamecafe.core.api.game.dto;

import java.time.Instant;
import ro.boardgamecafe.core.domain.game.CopyCondition;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;

/**
 * A physical copy. activeRequestStatus / tableNumber describe where it is right now: RESERVED (prepared
 * for a table) or DELIVERED (at the table); both are null when the copy is on the shelf or out of use.
 */
public record GameCopyResponse(
        Long id,
        Long gameId,
        String gameTitle,
        String inventoryCode,
        CopyCondition conditionStatus,
        String notes,
        Instant createdAt,
        Long activeRequestId,
        GameRequestStatus activeRequestStatus,
        Integer tableNumber
) {}
