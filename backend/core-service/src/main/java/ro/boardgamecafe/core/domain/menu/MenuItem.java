package ro.boardgamecafe.core.domain.menu;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;
import jakarta.persistence.*;

/**
 * A product with its current price. "active" is the logical delete flag (manager), "available" is the
 * temporary stock flag. A product can be ordered only if both are true and its category is active.
 * Price changes never affect existing orders, which keep a snapshot. There are no photos in v1: each
 * product has a thematic Lucide icon and a few short informative tags.
 */
@Entity
@Table(name = "menu_items")
public class MenuItem {
    public static final String DEFAULT_ICON = "coffee";
    public static final int MAX_TAGS = 5;
    public static final int MAX_TAG_LENGTH = 30;
    private static final Pattern ICON = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");

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
    @Column(nullable = false, length = 40)
    private String icon;
    @Convert(converter = TagListConverter.class)
    @Column(nullable = false, length = 200)
    private List<String> tags;

    protected MenuItem() {
    }

    public MenuItem(MenuCategory category, String name, String description, BigDecimal price) {
        this(category, name, description, price, null, null);
    }

    public MenuItem(MenuCategory category, String name, String description, BigDecimal price, String icon,
            List<String> tags) {
        moveTo(category);
        rename(name);
        describe(description);
        changePrice(price);
        changeIcon(icon == null ? DEFAULT_ICON : icon);
        changeTags(tags == null ? List.of() : tags);
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

    /** Prices must be strictly positive (design handoff); free items are not sold through the menu. */
    public void changePrice(BigDecimal price) {
        if (price == null || price.signum() <= 0) throw new IllegalArgumentException("Price must be greater than 0.");
        this.price = price;
    }

    public void changeIcon(String icon) {
        if (icon == null || icon.length() > 40 || !ICON.matcher(icon).matches())
            throw new IllegalArgumentException("Icon must be a Lucide icon name such as 'coffee' or 'cup-soda'.");
        this.icon = icon;
    }

    public void changeTags(List<String> tags) {
        List<String> cleaned = tags.stream().map(tag -> tag == null ? "" : tag.strip())
                .filter(tag -> !tag.isEmpty()).distinct().toList();
        if (cleaned.size() > MAX_TAGS) throw new IllegalArgumentException("At most " + MAX_TAGS + " tags are allowed.");
        for (String tag : cleaned) {
            if (tag.length() > MAX_TAG_LENGTH || tag.contains(TagListConverter.SEPARATOR))
                throw new IllegalArgumentException("Each tag has at most " + MAX_TAG_LENGTH + " characters and no '|'.");
        }
        this.tags = cleaned;
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
    public String getIcon() { return icon; }
    public List<String> getTags() { return tags; }
}
