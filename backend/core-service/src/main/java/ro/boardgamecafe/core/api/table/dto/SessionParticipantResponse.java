package ro.boardgamecafe.core.api.table.dto;

import java.time.Instant;

public record SessionParticipantResponse(Long sessionId, Long participantId, String displayName, Instant joinedAt) {}
