package ro.boardgamecafe.core.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import ro.boardgamecafe.core.domain.order.FoodOrder;
import ro.boardgamecafe.core.domain.order.OrderStatus;

public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {
    /** Serializes changes to one order: participant edit/cancel versus staff processing. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select foodOrder from FoodOrder foodOrder where foodOrder.id = :id")
    Optional<FoodOrder> findByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = { "items", "participant", "session", "session.table" })
    @Query("select foodOrder from FoodOrder foodOrder where foodOrder.id = :id")
    Optional<FoodOrder> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = { "items", "participant", "session", "session.table" })
    List<FoodOrder> findByParticipantIdOrderByPlacedAtDesc(Long participantId);

    @EntityGraph(attributePaths = { "items", "participant", "session", "session.table" })
    List<FoodOrder> findBySessionIdOrderByPlacedAtAsc(Long sessionId);

    @EntityGraph(attributePaths = { "items", "participant", "session", "session.table" })
    List<FoodOrder> findByStatusInOrderByPlacedAtAsc(Collection<OrderStatus> statuses);

    long countBySessionIdAndStatusIn(Long sessionId, Collection<OrderStatus> statuses);
}
