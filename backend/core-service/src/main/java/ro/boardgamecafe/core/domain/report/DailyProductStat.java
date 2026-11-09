package ro.boardgamecafe.core.domain.report;

import java.math.BigDecimal;
import jakarta.persistence.*;
import ro.boardgamecafe.core.domain.menu.MenuItem;

/** Sales of one product in one finalized day. The name is copied so later renames do not alter history. */
@Entity
@Table(name = "daily_product_stats")
public class DailyProductStat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_id", nullable = false)
    private DailyReport report;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;
    @Column(name = "product_name_snapshot", nullable = false, length = 150)
    private String productNameSnapshot;
    @Column(name = "quantity_sold", nullable = false)
    private int quantitySold;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal revenue;

    protected DailyProductStat() {
    }

    DailyProductStat(DailyReport report, MenuItem menuItem, DayFigures.ProductSales sales) {
        this.report = report;
        this.menuItem = menuItem;
        this.productNameSnapshot = sales.name();
        this.quantitySold = Math.toIntExact(sales.quantity());
        this.revenue = sales.revenue();
    }

    DayFigures.ProductSales toSales() {
        return new DayFigures.ProductSales(menuItem.getId(), productNameSnapshot, (long) quantitySold, revenue);
    }

    public Long getId() { return id; }
    public String getProductNameSnapshot() { return productNameSnapshot; }
    public int getQuantitySold() { return quantitySold; }
    public BigDecimal getRevenue() { return revenue; }
}
