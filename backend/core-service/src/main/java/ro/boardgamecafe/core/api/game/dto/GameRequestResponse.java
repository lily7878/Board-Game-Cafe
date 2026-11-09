package ro.boardgamecafe.core.api.game.dto;

import java.time.Instant;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;

public record GameRequestResponse(Long id, Long sessionId, Long participantId, Long gameId,
        Long gameCopyId, GameRequestStatus status, Instant requestedAt, Instant reservedAt,
        Instant deliveredAt, Instant returnedAt, Instant cancelledAt, String resolutionReason,
        Long processedById) {}
