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

    /** Staff board: requests in the given statuses, optionally limited to one business day, oldest first. */
    @Query("""
            select request from GameRequest request join fetch request.game join fetch request.participant
            join fetch request.session session join fetch session.table left join fetch request.gameCopy
            where request.status in :statuses and (:dayId is null or session.businessDay.id = :dayId)
            order by request.requestedAt asc""")
    List<GameRequest> findForBoard(@Param("statuses") java.util.Collection<GameRequestStatus> statuses,
            @Param("dayId") Long businessDayId);

    /** Active loans (RESERVED or DELIVERED) of the given copies, with the table they belong to. */
    @Query("""
            select request from GameRequest request join fetch request.session session join fetch session.table
            where request.gameCopy.id in :copyIds and request.status in :statuses""")
    List<GameRequest> findActiveForCopies(@Param("copyIds") java.util.Collection<Long> copyIds,
            @Param("statuses") java.util.Collection<GameRequestStatus> statuses);
    long countBySessionIdAndStatusIn(Long sessionId, java.util.Collection<GameRequestStatus> statuses);
}
