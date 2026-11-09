package ro.boardgamecafe.core.service;

import java.math.BigDecimal;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.domain.billing.PaymentStatus;
import ro.boardgamecafe.core.domain.order.OrderItemStatus;
import ro.boardgamecafe.core.domain.order.OrderStatus;
import ro.boardgamecafe.core.domain.report.DayFigures;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.repository.DayStatisticsRepository;

/** Computes the figures of one business day from paid sessions, using the aggregate queries. */
@Service
@Transactional(readOnly = true)
public class DayFiguresCalculator {
    private static final Logger log = LoggerFactory.getLogger(DayFiguresCalculator.class);
    private final DayStatisticsRepository statistics;

    public DayFiguresCalculator(DayStatisticsRepository statistics) {
        this.statistics = statistics;
    }

    public DayFigures compute(Long dayId) {
        List<DayFigures.ProductSales> products = statistics.productSales(dayId, SessionStatus.CLOSED,
                OrderStatus.DELIVERED, OrderItemStatus.ACCEPTED);
        List<DayFigures.GameUsage> games = statistics.gameUsage(dayId);
        BigDecimal menuRevenue = products.stream().map(DayFigures.ProductSales::revenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal feeRevenue = statistics.accessFeeRevenue(dayId, SessionStatus.CLOSED);
        BigDecimal paid = statistics.paymentsTotal(dayId, PaymentStatus.SUCCEEDED);
        if (paid.compareTo(menuRevenue.add(feeRevenue)) != 0)
            log.warn("Business day {}: payments {} differ from menu {} + fees {}", dayId, paid, menuRevenue, feeRevenue);
        int productsSold = products.stream().mapToInt(sales -> Math.toIntExact(sales.quantity())).sum();
        int gamesDelivered = games.stream().mapToInt(usage -> Math.toIntExact(usage.delivered())).sum();
        return new DayFigures(paid, menuRevenue, feeRevenue,
                Math.toIntExact(statistics.closedSessions(dayId, SessionStatus.CLOSED)),
                Math.toIntExact(statistics.deliveredOrders(dayId, SessionStatus.CLOSED, OrderStatus.DELIVERED)),
                productsSold, gamesDelivered, products, games);
    }
}
