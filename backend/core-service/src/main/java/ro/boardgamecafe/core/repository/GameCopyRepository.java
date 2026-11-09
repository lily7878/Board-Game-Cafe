package ro.boardgamecafe.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;
import java.util.Set;

import ro.boardgamecafe.core.domain.game.CopyCondition;
import ro.boardgamecafe.core.domain.game.GameCopy;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;

public interface GameCopyRepository extends JpaRepository<GameCopy, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select copy from GameCopy copy where copy.id = :id")
    Optional<GameCopy> findByIdForUpdate(@Param("id") Long id);

    @Query(value = "select gc.* from game_copies gc where gc.game_id = :gameId "
            + "and gc.condition_status = 'USABLE' "
            + "and not exists (select 1 from game_requests gr where gr.game_copy_id = gc.id "
            + "and gr.status in ('RESERVED', 'DELIVERED')) "
            + "order by gc.id limit 1 for update of gc skip locked", nativeQuery = true)
    Optional<GameCopy> findReservableCopy(@Param("gameId") Long gameId);
    boolean existsByInventoryCode(String inventoryCode);

    List<GameCopy> findByGameIdOrderByIdAsc(Long gameId);

    @Query("select count(copy) from GameCopy copy where copy.game.id = :gameId "
            + "and copy.conditionStatus = :condition and not exists "
            + "(select request.id from GameRequest request where request.gameCopy = copy "
            + "and request.status in :occupiedStatuses)")
    long countAvailableByGameId(@Param("gameId") Long gameId, @Param("condition") CopyCondition condition,
            @Param("occupiedStatuses") List<GameRequestStatus> occupiedStatuses);

    @Query("select copy.game.id, count(copy) from GameCopy copy "
            + "where copy.game.id in :gameIds and copy.conditionStatus = :condition "
            + "and not exists (select request.id from GameRequest request where request.gameCopy = copy "
            + "and request.status in :occupiedStatuses) "
            + "group by copy.game.id")
    List<Object[]> countByGameIdsAndCondition(@Param("gameIds") Set<Long> gameIds,
            @Param("condition") CopyCondition condition,
            @Param("occupiedStatuses") List<GameRequestStatus> occupiedStatuses);
}
