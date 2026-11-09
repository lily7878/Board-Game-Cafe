package ro.boardgamecafe.core.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.domain.table.TableSession;

public interface TableSessionRepository extends JpaRepository<TableSession, Long> {
    boolean existsByTableIdAndStatusNot(Long tableId, SessionStatus status);
    Optional<TableSession> findByTableIdAndStatusNot(Long tableId, SessionStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select session from TableSession session where session.joinTokenDigest = :digest")
    Optional<TableSession> findByJoinTokenDigestForUpdate(@Param("digest") String digest);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select session from TableSession session where session.id = :id")
    Optional<TableSession> findByIdForUpdate(@Param("id") Long id);
}
