package ro.boardgamecafe.core.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.billing.Payment;
import ro.boardgamecafe.core.domain.billing.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @EntityGraph(attributePaths = { "initiatedBy", "session" })
    Optional<Payment> findByIdempotencyKey(UUID idempotencyKey);

    @EntityGraph(attributePaths = { "initiatedBy", "session" })
    List<Payment> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    boolean existsBySessionIdAndStatus(Long sessionId, PaymentStatus status);
}
