package ro.boardgamecafe.core.api.billing.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import ro.boardgamecafe.core.domain.billing.PaymentMethod;
import ro.boardgamecafe.core.domain.billing.PaymentStatus;
import ro.boardgamecafe.core.domain.table.SessionStatus;

public record PaymentResponse(Long id, Long sessionId, Long initiatedById, String initiatedByName, BigDecimal amount,
        PaymentStatus status, PaymentMethod method, UUID idempotencyKey, Instant createdAt, Instant completedAt,
        String failureReason, SessionStatus sessionStatus) {}
