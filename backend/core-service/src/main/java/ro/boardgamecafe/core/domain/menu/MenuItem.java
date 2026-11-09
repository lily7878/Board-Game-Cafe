package ro.boardgamecafe.core.domain.menu;

import java.math.BigDecimal;
import java.time.Instant;
import jakarta.persistence.*;

/**
 * A product with its current price. "active" is the logical delete flag (manager), "available" is the
 * temporary stock flag. A product can be ordered only if both are true and its category is active.
 * Price changes never affect existing orders, which keep a snapshot.
 */
@Entity
@Table(name = "menu_items")
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private MenuCategory category;
    @Column(nullable = false, length = 150)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    @Column(nullable = false)
    private boolean available;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected MenuItem() {
    }

    public MenuItem(MenuCategory category, String name, String description, BigDecimal price) {
        moveTo(category);
        rename(name);
        describe(description);
        changePrice(price);
        this.available = true;
        this.active = true;
        this.createdAt = Instant.now();
    }

    public boolean isOrderable() {
        return active && available && category.isActive();
    }

    public void moveTo(MenuCategory category) {
        if (category == null) throw new IllegalArgumentException("Menu category is required.");
        this.category = category;
    }

    public void rename(String name) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Product name is required.");
        if (name.strip().length() > 150) throw new IllegalArgumentException("Product name is too long.");
        this.name = name.strip();
    }

    public void describe(String description) {
        this.description = description == null || description.isBlank() ? null : description.strip();
    }

    public void changePrice(BigDecimal price) {
        if (price == null || price.signum() < 0) throw new IllegalArgumentException("Price must be zero or positive.");
        this.price = price;
    }

    public void setAvailable(boolean available) { this.available = available; }
    public void setActive(boolean active) { this.active = active; }

    public Long getId() { return id; }
    public MenuCategory getCategory() { return category; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public boolean isAvailable() { return available; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
}
