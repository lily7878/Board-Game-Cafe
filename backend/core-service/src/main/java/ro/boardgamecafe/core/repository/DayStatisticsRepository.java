package ro.boardgamecafe.core.repository;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import ro.boardgamecafe.core.domain.billing.PaymentStatus;
import ro.boardgamecafe.core.domain.order.OrderItemStatus;
import ro.boardgamecafe.core.domain.order.OrderStatus;
import ro.boardgamecafe.core.domain.report.DailyReport;
import ro.boardgamecafe.core.domain.report.DayFigures;
import ro.boardgamecafe.core.domain.table.SessionStatus;

/**
 * Aggregate queries over the operational tables of one business day. Revenue only counts paid (CLOSED)
 * sessions; nothing is computed from values sent by a client.
 */
public interface DayStatisticsRepository extends Repository<DailyReport, Long> {

    /** Custom query: product sales = accepted lines of delivered orders, grouped per product. */
    @Query("""
            select new ro.boardgamecafe.core.domain.report.DayFigures$ProductSales(
                item.menuItem.id, item.menuItem.name, sum(item.quantity), sum(item.unitPrice * item.quantity))
            from OrderItem item join item.order foodOrder join foodOrder.session session
            where session.businessDay.id = :dayId and session.status = :closed
              and foodOrder.status = :delivered and item.status = :accepted
            group by item.menuItem.id, item.menuItem.name
            order by sum(item.quantity) desc, item.menuItem.name""")
    List<DayFigures.ProductSales> productSales(@Param("dayId") Long dayId, @Param("closed") SessionStatus closed,
            @Param("delivered") OrderStatus delivered, @Param("accepted") OrderItemStatus accepted);

    /** Custom query: requests per game and how many of them were actually handed to the table. */
    @Query("""
            select new ro.boardgamecafe.core.domain.report.DayFigures$GameUsage(
                request.game.id, request.game.title, count(request),
                sum(case when request.deliveredAt is not null then 1L else 0L end))
            from GameRequest request
            where request.session.businessDay.id = :dayId
            group by request.game.id, request.game.title
            order by sum(case when request.deliveredAt is not null then 1L else 0L end) desc, count(request) desc""")
    List<DayFigures.GameUsage> gameUsage(@Param("dayId") Long dayId);

    @Query("""
            select coalesce(sum(fee.quantity * session.accessFeeUnitPrice), 0)
            from SessionFee fee join fee.session session
            where session.businessDay.id = :dayId and session.status = :closed""")
    BigDecimal accessFeeRevenue(@Param("dayId") Long dayId, @Param("closed") SessionStatus closed);

    @Query("""
            select coalesce(sum(payment.amount), 0) from Payment payment
            where payment.session.businessDay.id = :dayId and payment.status = :succeeded""")
    BigDecimal paymentsTotal(@Param("dayId") Long dayId, @Param("succeeded") PaymentStatus succeeded);

    @Query("select count(session) from TableSession session where session.businessDay.id = :dayId and session.status = :closed")
    long closedSessions(@Param("dayId") Long dayId, @Param("closed") SessionStatus closed);

    @Query("""
            select count(foodOrder) from FoodOrder foodOrder
            where foodOrder.session.businessDay.id = :dayId and foodOrder.session.status = :closed
              and foodOrder.status = :delivered""")
    long deliveredOrders(@Param("dayId") Long dayId, @Param("closed") SessionStatus closed,
            @Param("delivered") OrderStatus delivered);
}
