package ro.boardgamecafe.core.api.report.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import ro.boardgamecafe.core.domain.day.BusinessDayStatus;
import ro.boardgamecafe.core.domain.report.DayFigures;

/** Response bodies for business days, End of Day, reports and day comparison. */
public final class ReportResponses {
    private ReportResponses() {
    }

    /** One business day in the history list; totalRevenue is null while the day is open. */
    public record DaySummary(Long businessDayId, int dayNumber, String label, BusinessDayStatus status,
            Instant openedAt, Instant finalizedAt, BigDecimal totalRevenue) {}

    /** Live figures of the open day (paid sessions only) and whether End of Day is currently allowed. */
    public record CurrentDayPreview(Long businessDayId, int dayNumber, String label, Instant openedAt,
            long openSessions, boolean canFinalize, DayFigures figures) {}

    /** The final, immutable report of a finalized day. */
    public record DailyReport(Long businessDayId, int dayNumber, String label, Instant openedAt, Instant finalizedAt,
            String finalizedBy, Instant generatedAt, DayFigures figures) {}

    /** Totals of one finalized day, used for comparisons. */
    public record DayTotals(Long businessDayId, int dayNumber, String label, BigDecimal totalRevenue,
            BigDecimal menuRevenue, BigDecimal accessFeeRevenue, int closedSessions, int deliveredOrders,
            int productsSold, int gamesDelivered) {}

    /** Comparison of finalized simulated days (never hours) with the top products and games of the range. */
    public record DayComparison(int fromDay, int toDay, List<DayTotals> days,
            List<DayFigures.ProductSales> topProducts, List<DayFigures.GameUsage> topGames) {}
}
