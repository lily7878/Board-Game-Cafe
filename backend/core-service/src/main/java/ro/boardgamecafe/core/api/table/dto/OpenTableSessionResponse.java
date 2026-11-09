package ro.boardgamecafe.core.api.table.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record OpenTableSessionResponse(Long sessionId, Long tableId, String joinToken, String pin, Instant startedAt,
        Long businessDayId, BigDecimal accessFeeUnitPrice) {}
