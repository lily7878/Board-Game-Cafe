package ro.boardgamecafe.core.domain.order;

import java.math.BigDecimal;
import jakarta.persistence.*;
import ro.boardgamecafe.core.domain.menu.MenuItem;

/** One order line with the product name and unit price copied at ordering time. */
@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private FoodOrder order;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;
    @Column(name = "product_name_snapshot", nullable = false, length = 150)
    private String productNameSnapshot;
    @Column(nullable = false)
    private int quantity;
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private OrderItemStatus status;
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    protected OrderItem() {
    }

    OrderItem(FoodOrder order, MenuItem menuItem, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive.");
        this.order = order;
        this.menuItem = menuItem;
        this.productNameSnapshot = menuItem.getName();
        this.unitPrice = menuItem.getPrice();
        this.quantity = quantity;
        this.status = OrderItemStatus.PENDING;
    }

    void accept() {
        this.status = OrderItemStatus.ACCEPTED;
        this.rejectionReason = null;
    }

    void reject(String reason) {
        this.status = OrderItemStatus.REJECTED;
        this.rejectionReason = reason == null || reason.isBlank() ? null : reason.strip();
    }

    /** Value of the line unless it was rejected. */
    public BigDecimal lineTotal() {
        return status == OrderItemStatus.REJECTED ? BigDecimal.ZERO
                : unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public Long getId() { return id; }
    public FoodOrder getOrder() { return order; }
    public MenuItem getMenuItem() { return menuItem; }
    public String getProductNameSnapshot() { return productNameSnapshot; }
    public int getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public OrderItemStatus getStatus() { return status; }
    public String getRejectionReason() { return rejectionReason; }
}
