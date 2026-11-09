package ro.boardgamecafe.core.api.settings.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record CafeSettingsResponse(String cafeName, BigDecimal accessFeePrice, int maxDeliveredGamesPerTable,
        Instant updatedAt) {}
