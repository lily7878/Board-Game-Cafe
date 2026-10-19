package ro.boardgamecafe.core.domain.table;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity 
@Table(name = "cafe_tables")
public class CafeTable {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_number", nullable = false, unique = true)
    private Integer tableNumber;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected CafeTable() {
        // Default constructor for JPA
    }

    public CafeTable(Integer tableNumber, Integer capacity) {
        if(tableNumber == null || tableNumber <= 0) {
            throw new IllegalArgumentException("Table number must be a positive integer.");
        }
        if(capacity == null || capacity <= 0) {
            throw new IllegalArgumentException("Capacity must be a positive integer.");
        }
        this.tableNumber = tableNumber;
        this.capacity = capacity;
        this.active = true; // Default to active when created
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }
    public Integer getTableNumber() {
        return tableNumber;
    }
    public Integer getCapacity() {
        return capacity;
    }
    public Boolean getActive() {
        return active;
    }
    public Instant getCreatedAt() {
        return createdAt;
    }

    public void changeTableNumber(Integer newTableNumber) {
        if(newTableNumber == null || newTableNumber <= 0) {
            throw new IllegalArgumentException("New table number must be a positive integer.");
        }
        this.tableNumber = newTableNumber;
    }

    public void changeCapacity(Integer newCapacity) {
        if(newCapacity == null || newCapacity <= 0) {
            throw new IllegalArgumentException("New capacity must be a positive integer.");
        }
        this.capacity = newCapacity;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }
}
