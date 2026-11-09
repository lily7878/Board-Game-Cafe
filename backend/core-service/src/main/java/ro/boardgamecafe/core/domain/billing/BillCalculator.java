package ro.boardgamecafe.core.domain.billing;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import ro.boardgamecafe.core.domain.order.FoodOrder;
import ro.boardgamecafe.core.domain.order.OrderItem;
import ro.boardgamecafe.core.domain.order.OrderItemStatus;
import ro.boardgamecafe.core.domain.order.OrderStatus;
import ro.boardgamecafe.core.domain.table.SessionParticipant;

/** Pure computation of the shared bill from already loaded data; no database access, easy to unit test. */
public final class BillCalculator {
    private BillCalculator() {
    }

    /**
     * @param feeUnitPrice snapshot copied into the session when it was opened
     * @param persons declared number of people, or null if not declared yet
     * @param participants everyone who joined the session, so participants without orders also appear
     * @param orders all orders of the session
     * @param unresolvedGameRequests game requests still REQUESTED, RESERVED or DELIVERED
     */
    public static Bill calculate(BigDecimal feeUnitPrice, Integer persons, List<SessionParticipant> participants,
            List<FoodOrder> orders, long unresolvedGameRequests) {
        Map<Long, List<Bill.Line>> linesByParticipant = new LinkedHashMap<>();
        participants.forEach(participant -> linesByParticipant.put(participant.getId(), new ArrayList<>()));
        BigDecimal pendingValue = BigDecimal.ZERO;
        int openOrders = 0;

        for (FoodOrder order : orders) {
            if (order.getStatus() == OrderStatus.DELIVERED) {
                List<Bill.Line> lines = linesByParticipant.computeIfAbsent(order.getParticipant().getId(),
                        id -> new ArrayList<>());
                for (OrderItem item : order.getItems()) {
                    if (item.getStatus() == OrderItemStatus.ACCEPTED)
                        lines.add(new Bill.Line(order.getId(), item.getProductNameSnapshot(), item.getQuantity(),
                                item.getUnitPrice(), item.lineTotal()));
                }
            } else if (order.getStatus() != OrderStatus.CANCELLED) {
                openOrders++;
                pendingValue = pendingValue.add(order.total());
            }
        }

        List<Bill.ParticipantShare> shares = new ArrayList<>();
        BigDecimal menuTotal = BigDecimal.ZERO;
        for (SessionParticipant participant : participants) {
            List<Bill.Line> lines = linesByParticipant.get(participant.getId());
            BigDecimal share = sum(lines);
            menuTotal = menuTotal.add(share);
            shares.add(new Bill.ParticipantShare(participant.getId(), participant.getDisplayName(),
                    participant.isActive(), share, List.copyOf(lines)));
        }

        BigDecimal feesTotal = persons == null ? BigDecimal.ZERO : feeUnitPrice.multiply(BigDecimal.valueOf(persons));
        return new Bill(feeUnitPrice, persons, feesTotal, menuTotal, menuTotal.add(feesTotal), pendingValue,
                shares, new Bill.Obstacles(openOrders, unresolvedGameRequests, persons == null));
    }

    private static BigDecimal sum(List<Bill.Line> lines) {
        return lines.stream().map(Bill.Line::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
