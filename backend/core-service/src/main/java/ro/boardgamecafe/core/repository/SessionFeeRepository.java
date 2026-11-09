package ro.boardgamecafe.core.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.boardgamecafe.core.domain.billing.SessionFee;

public interface SessionFeeRepository extends JpaRepository<SessionFee, Long> {
    Optional<SessionFee> findBySessionId(Long sessionId);
}
