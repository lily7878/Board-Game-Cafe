package ro.boardgamecafe.core.domain.game;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "game_categories")
public class GameCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description", nullable = true, columnDefinition = "TEXT")
    private String description;

    @Column(name = "active", nullable = false)
    private Boolean active;

    public GameCategory() {
    }

    public GameCategory(String name, String description, Boolean active) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Game category name cannot be null or blank");
        }
        if (active == null) {
            throw new IllegalArgumentException("Game category active status cannot be null");
        }
        if (description != null && description.isBlank()) {
            throw new IllegalArgumentException("Game category description cannot be blank");
        }
        this.name = name;
        this.description = description;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Boolean getActive() {
        return active;
    }

    public void changeName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Game category name cannot be null or blank");
        }
        this.name = name;
    }

    public void changeDescription(String description) {
        if (description != null && description.isBlank()) {
            throw new IllegalArgumentException("Game category description cannot be blank");
        }
        this.description = description;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

}
