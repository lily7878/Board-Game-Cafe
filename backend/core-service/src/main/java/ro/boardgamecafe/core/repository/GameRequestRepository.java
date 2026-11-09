package ro.boardgamecafe.core.repository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.boardgamecafe.core.domain.game.GameRequest;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;

public interface GameRequestRepository extends JpaRepository<GameRequest, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from GameRequest request where request.id = :id")
    Optional<GameRequest> findByIdForUpdate(@Param("id") Long id);
    List<GameRequest> findBySessionIdOrderByRequestedAtAsc(Long sessionId);
    List<GameRequest> findByParticipantIdOrderByRequestedAtDesc(Long participantId);
    long countBySessionIdAndStatus(Long sessionId, GameRequestStatus status);
    long countBySessionIdAndStatusIn(Long sessionId, java.util.Collection<GameRequestStatus> statuses);
}
