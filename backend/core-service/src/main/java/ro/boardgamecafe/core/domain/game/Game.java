package ro.boardgamecafe.core.domain.game;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import jakarta.annotation.Generated;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

@Entity 
@Table(name = "games")
public class Game {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_rules", nullable = true, columnDefinition = "TEXT")
    private String shortRules;

    @Column(name = "min_players", nullable = false)
    private Integer minPlayers;

    @Column(name = "max_players", nullable = false)
    private Integer maxPlayers;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "minimum_age", nullable = false)
    private Integer minimumAge;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false)
    private GameDifficulty difficulty;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "game_category_links",
        joinColumns = @JoinColumn(name = "game_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<GameCategory> categories = new HashSet<>();

    public Game() {
        // Default constructor for JPA
    }

    public Game(String title, String description, String shortRules, Integer minPlayers, Integer maxPlayers,
                Integer durationMinutes, Integer minimumAge, GameDifficulty difficulty, Set<GameCategory> categories) 
    {

        if (minPlayers == null || minPlayers < 1) {
            throw new IllegalArgumentException("Minimum players must be a positive integer.");
        }
        if(maxPlayers == null || maxPlayers < minPlayers) {
            throw new IllegalArgumentException("Maximum players must be greater than or equal to minimum players.");
        }
        if(durationMinutes == null || durationMinutes < 1) {
            throw new IllegalArgumentException("Duration must be a positive integer.");
        }
        if(minimumAge == null || minimumAge < 0) {
            throw new IllegalArgumentException("Minimum age must be a non-negative integer.");
        }
        if(difficulty == null) {
            throw new IllegalArgumentException("Difficulty must be one of the following: EASY, MEDIUM, HARD.");
        }
        if(title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be null or empty.");
        }
        if(description == null || description.trim().isEmpty()) {
            throw new IllegalArgumentException("Description cannot be null or empty.");
        }
        if(title.length() > 150) {
            throw new IllegalArgumentException("Title cannot exceed 150 characters.");
        }

        this.title = title;
        this.description = description;
        this.shortRules = shortRules;
        this.minPlayers = minPlayers;
        this.maxPlayers = maxPlayers;
        this.durationMinutes = durationMinutes;
        this.minimumAge = minimumAge;
        this.difficulty = difficulty;
        this.active = true; // Default to true when creating a new game
        this.createdAt = Instant.now(); // Set to current timestamp when creating a new game
        this.categories = categories == null ? new HashSet<>() : new HashSet<>(categories);
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getShortRules() {
        return shortRules;
    }

    public Integer getMinPlayers() {
        return minPlayers;
    }

    public Integer getMaxPlayers() {
        return maxPlayers;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public Integer getMinimumAge() {
        return minimumAge;
    }

    public GameDifficulty getDifficulty() {
        return difficulty;
    }

    public Boolean getActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Set<GameCategory> getCategories() {
        return Set.copyOf(categories);
    }

    public void deactivate() {
        this.active = false;
    }

    public void activate() {
        this.active = true;
    }

    public void changePlayerRange(Integer newMinPlayers, Integer newMaxPlayers) {
        if (newMinPlayers == null || newMinPlayers < 1) {
            throw new IllegalArgumentException("Minimum players must be a positive integer.");
        }
        if (newMaxPlayers == null || newMaxPlayers < newMinPlayers) {
            throw new IllegalArgumentException("Maximum players must be greater than or equal to minimum players.");
        }
        this.minPlayers = newMinPlayers;
        this.maxPlayers = newMaxPlayers;
    }

    public void updateDetails(String title, String description, String shortRules, Integer minPlayers, Integer maxPlayers, Integer durationMinutes, Integer minimumAge, GameDifficulty difficulty) {
        if (title == null || title.isBlank() || title.length() > 150 || 
            description == null || description.isBlank() || durationMinutes == null || 
            durationMinutes < 1 || minimumAge == null || minimumAge < 0 || difficulty == null) 
            throw new IllegalArgumentException("Invalid game details.");
        changePlayerRange(minPlayers, maxPlayers);
        this.title = title; 
        this.description = description; 
        this.shortRules = shortRules; 
        this.durationMinutes = durationMinutes; 
        this.minimumAge = minimumAge; 
        this.difficulty = difficulty;
    }

    public void replaceCategories(Set<GameCategory> categories) { 
        this.categories = categories == null ? new HashSet<>() : new HashSet<>(categories); }

}
