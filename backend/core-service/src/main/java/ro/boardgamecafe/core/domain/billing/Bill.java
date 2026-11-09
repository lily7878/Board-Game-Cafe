package ro.boardgamecafe.core.domain.billing;

import java.math.BigDecimal;
import java.util.List;

/**
 * The shared bill of a session, always computed on the server.
 * menuTotal counts only ACCEPTED lines of DELIVERED orders; feesTotal = persons × fee snapshot.
 * pendingOrdersValue is informative: accepted or undecided lines of orders not delivered yet.
 */
public record Bill(BigDecimal accessFeeUnitPrice, Integer persons, BigDecimal feesTotal, BigDecimal menuTotal,
        BigDecimal total, BigDecimal pendingOrdersValue, List<ParticipantShare> participants, Obstacles obstacles) {

    public record ParticipantShare(Long participantId, String displayName, boolean active, BigDecimal menuTotal,
            List<Line> lines) {}

    public record Line(Long orderId, String productName, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {}

    /** What still prevents the payment. */
    public record Obstacles(int openOrders, long unresolvedGameRequests, boolean personsMissing) {
        public boolean none() {
            return openOrders == 0 && unresolvedGameRequests == 0 && !personsMissing;
        }
    }
}
