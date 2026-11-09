package ro.boardgamecafe.core.domain.game;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity 
@Table(name = "game_copies")
public class GameCopy {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(name = "inventory_code", unique = true, nullable = false)
    private String inventoryCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_status", nullable = false)
    private CopyCondition conditionStatus;

    @Column(name = "notes", columnDefinition = "TEXT", nullable = true)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public GameCopy() {
        // Default constructor for JPA
    }

    public GameCopy(Game game, String inventoryCode, CopyCondition conditionStatus, String notes) {
        if (game == null) {
            throw new IllegalArgumentException("Game cannot be null");
        }
        if (inventoryCode == null || inventoryCode.isBlank() || inventoryCode.length() > 255) {
            throw new IllegalArgumentException("Inventory code must contain 1 to 255 characters");
        }
        if (conditionStatus == null) {
            throw new IllegalArgumentException("Condition status cannot be null");
        }
        this.game = game;
        this.inventoryCode = inventoryCode.trim();
        this.conditionStatus = conditionStatus;
        this.notes = notes;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Game getGame() {
        return game;
    }

    public String getInventoryCode() {
        return inventoryCode;
    }

    public CopyCondition getConditionStatus() {
        return conditionStatus;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void changeConditionStatus(CopyCondition newConditionStatus) {
        if (newConditionStatus == null) {
            throw new IllegalArgumentException("New condition status cannot be null");
        }
        this.conditionStatus = newConditionStatus;
    }

    public void changeNotes(String newNotes) {
        this.notes = newNotes;
    }

}
