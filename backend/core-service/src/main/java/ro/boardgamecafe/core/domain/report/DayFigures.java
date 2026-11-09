package ro.boardgamecafe.core.domain.report;

import java.math.BigDecimal;
import java.util.List;

/**
 * Figures of one business day, computed from paid (CLOSED) sessions. Used both for the live preview of
 * the open day and as the content written into the final {@link DailyReport}.
 * totalRevenue is the sum of SUCCEEDED payments; it equals menuRevenue + accessFeeRevenue.
 */
public record DayFigures(BigDecimal totalRevenue, BigDecimal menuRevenue, BigDecimal accessFeeRevenue,
        int closedSessions, int deliveredOrders, int productsSold, int gamesDelivered,
        List<ProductSales> products, List<GameUsage> games) {

    /** Sales of one product: accepted lines of delivered orders. */
    public record ProductSales(Long menuItemId, String name, Long quantity, BigDecimal revenue) {}

    /** Requests and actual loans (delivered at least once) of one game title. */
    public record GameUsage(Long gameId, String title, Long requested, Long delivered) {}
}
