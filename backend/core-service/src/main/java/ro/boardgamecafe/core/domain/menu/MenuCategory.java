package ro.boardgamecafe.core.domain.menu;

import jakarta.persistence.*;

/** Groups menu products. Deactivated instead of deleted, so historical orders stay intact. */
@Entity
@Table(name = "menu_categories")
public class MenuCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected MenuCategory() {
    }

    public MenuCategory(String name, String description) {
        this(name, description, 0);
    }

    public MenuCategory(String name, String description, int sortOrder) {
        rename(name);
        describe(description);
        moveToPosition(sortOrder);
        this.active = true;
    }

    public void moveToPosition(int sortOrder) {
        if (sortOrder < 0) throw new IllegalArgumentException("Sort order cannot be negative.");
        this.sortOrder = sortOrder;
    }

    public int getSortOrder() { return sortOrder; }

    public void rename(String name) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Menu category name is required.");
        this.name = name.strip();
    }

    public void describe(String description) {
        this.description = description == null || description.isBlank() ? null : description.strip();
    }

    public void setActive(boolean active) { this.active = active; }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public boolean isActive() { return active; }
}
