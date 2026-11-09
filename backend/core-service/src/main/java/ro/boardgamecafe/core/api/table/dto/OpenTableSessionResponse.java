package ro.boardgamecafe.core.api.table.dto;

import java.time.Instant;

public record OpenTableSessionResponse(Long sessionId, Long tableId, String joinToken, String pin, Instant startedAt) {}
