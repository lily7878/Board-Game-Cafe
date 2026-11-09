package ro.boardgamecafe.core.domain.report;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import jakarta.persistence.*;
import ro.boardgamecafe.core.domain.day.BusinessDay;
import ro.boardgamecafe.core.domain.game.Game;
import ro.boardgamecafe.core.domain.menu.MenuItem;

/** Immutable snapshot of a finalized business day. There are no setters: the report is written once. */
@Entity
@Table(name = "daily_reports")
public class DailyReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_day_id", nullable = false, unique = true)
    private BusinessDay businessDay;
    @Column(name = "total_revenue", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalRevenue;
    @Column(name = "menu_revenue", nullable = false, precision = 12, scale = 2)
    private BigDecimal menuRevenue;
    @Column(name = "access_fee_revenue", nullable = false, precision = 12, scale = 2)
    private BigDecimal accessFeeRevenue;
    @Column(name = "closed_sessions_count", nullable = false)
    private int closedSessionsCount;
    @Column(name = "delivered_orders_count", nullable = false)
    private int deliveredOrdersCount;
    @Column(name = "products_sold_count", nullable = false)
    private int productsSoldCount;
    @Column(name = "games_delivered_count", nullable = false)
    private int gamesDeliveredCount;
    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;
    @OneToMany(mappedBy = "report", cascade = CascadeType.PERSIST)
    @OrderBy("quantitySold DESC, productNameSnapshot ASC")
    private List<DailyProductStat> productStats = new ArrayList<>();
    @OneToMany(mappedBy = "report", cascade = CascadeType.PERSIST)
    @OrderBy("timesDelivered DESC, gameTitleSnapshot ASC")
    private List<DailyGameStat> gameStats = new ArrayList<>();

    protected DailyReport() {
    }

    /**
     * @param menuItems / games entity references for the statistics rows, looked up by id
     */
    public DailyReport(BusinessDay day, DayFigures figures, java.util.function.Function<Long, MenuItem> menuItems,
            java.util.function.Function<Long, Game> games) {
        this.businessDay = day;
        this.totalRevenue = figures.totalRevenue();
        this.menuRevenue = figures.menuRevenue();
        this.accessFeeRevenue = figures.accessFeeRevenue();
        this.closedSessionsCount = figures.closedSessions();
        this.deliveredOrdersCount = figures.deliveredOrders();
        this.productsSoldCount = figures.productsSold();
        this.gamesDeliveredCount = figures.gamesDelivered();
        this.generatedAt = Instant.now();
        for (DayFigures.ProductSales sales : figures.products())
            productStats.add(new DailyProductStat(this, menuItems.apply(sales.menuItemId()), sales));
        for (DayFigures.GameUsage usage : figures.games())
            gameStats.add(new DailyGameStat(this, games.apply(usage.gameId()), usage));
    }

    public DayFigures toFigures() {
        return new DayFigures(totalRevenue, menuRevenue, accessFeeRevenue, closedSessionsCount, deliveredOrdersCount,
                productsSoldCount, gamesDeliveredCount,
                productStats.stream().map(DailyProductStat::toSales).toList(),
                gameStats.stream().map(DailyGameStat::toUsage).toList());
    }

    public Long getId() { return id; }
    public BusinessDay getBusinessDay() { return businessDay; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public BigDecimal getMenuRevenue() { return menuRevenue; }
    public BigDecimal getAccessFeeRevenue() { return accessFeeRevenue; }
    public int getClosedSessionsCount() { return closedSessionsCount; }
    public int getDeliveredOrdersCount() { return deliveredOrdersCount; }
    public int getProductsSoldCount() { return productsSoldCount; }
    public int getGamesDeliveredCount() { return gamesDeliveredCount; }
    public Instant getGeneratedAt() { return generatedAt; }
    public List<DailyProductStat> getProductStats() { return Collections.unmodifiableList(productStats); }
    public List<DailyGameStat> getGameStats() { return Collections.unmodifiableList(gameStats); }
}
