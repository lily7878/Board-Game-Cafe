package ro.boardgamecafe.core.repository;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import ro.boardgamecafe.core.domain.game.GameRequest;
import ro.boardgamecafe.core.domain.game.GameRequestStatus;
import ro.boardgamecafe.core.domain.order.OrderStatus;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.domain.table.TableSession;

/**
 * Grouped counts for the live views (tables grid, session drawer, participant dashboard). Each query
 * returns rows of [sessionId, count] for many sessions at once, so a screen needs a fixed number of queries.
 */
public interface SessionOverviewRepository extends Repository<TableSession, Long> {

    @Query("""
            select session from TableSession session join fetch session.table left join fetch session.openedBy
            join fetch session.businessDay where session.status <> :closed""")
    List<TableSession> findOpenSessions(@Param("closed") SessionStatus closed);

    @Query("""
            select participant.session.id, count(participant) from SessionParticipant participant
            where participant.session.id in :sessionIds and participant.active = true
            group by participant.session.id""")
    List<Object[]> countConnectedParticipants(@Param("sessionIds") Collection<Long> sessionIds);

    @Query("""
            select foodOrder.session.id, count(foodOrder) from FoodOrder foodOrder
            where foodOrder.session.id in :sessionIds and foodOrder.status in :statuses
            group by foodOrder.session.id""")
    List<Object[]> countOrders(@Param("sessionIds") Collection<Long> sessionIds,
            @Param("statuses") Collection<OrderStatus> statuses);

    @Query("""
            select request.session.id, count(request) from GameRequest request
            where request.session.id in :sessionIds and request.status in :statuses
            group by request.session.id""")
    List<Object[]> countGameRequests(@Param("sessionIds") Collection<Long> sessionIds,
            @Param("statuses") Collection<GameRequestStatus> statuses);

    /** Games currently at (or reserved for) one table, with their titles. */
    @Query("""
            select request from GameRequest request join fetch request.game left join fetch request.gameCopy
            where request.session.id = :sessionId and request.status in :statuses
            order by request.requestedAt""")
    List<GameRequest> findGamesOfSession(@Param("sessionId") Long sessionId,
            @Param("statuses") Collection<GameRequestStatus> statuses);
}
