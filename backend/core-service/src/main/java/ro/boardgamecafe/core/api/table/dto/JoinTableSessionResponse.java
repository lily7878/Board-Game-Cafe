package ro.boardgamecafe.core.api.table.dto;

public record JoinTableSessionResponse(Long sessionId, Long participantId, String displayName, String accessToken) {}
