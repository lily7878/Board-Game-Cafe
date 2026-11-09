package ro.boardgamecafe.core.api.day.dto;

import java.time.Instant;
import ro.boardgamecafe.core.domain.day.BusinessDayStatus;

public record BusinessDayResponse(Long id, int dayNumber, String label, BusinessDayStatus status,
        Instant openedAt, Instant finalizedAt) {}
