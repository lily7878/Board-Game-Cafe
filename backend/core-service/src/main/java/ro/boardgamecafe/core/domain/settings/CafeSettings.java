package ro.boardgamecafe.core.domain.settings;

import java.math.BigDecimal;
import java.time.Instant;
import jakarta.persistence.*;

/**
 * Global configuration managed by the manager. There is exactly one row (id = 1), created by migration V5.
 * The fee applies only to sessions opened afterwards; each session keeps its own snapshot.
 */
@Entity
@Table(name = "cafe_settings")
public class CafeSettings {
    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id;
    @Column(name = "cafe_name", nullable = false, length = 100)
    private String cafeName;
    @Column(name = "access_fee_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal accessFeePrice;
    @Column(name = "max_delivered_games_per_table", nullable = false)
    private int maxDeliveredGamesPerTable;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Version
    private long version;

    protected CafeSettings() {
    }

    public void update(String cafeName, BigDecimal accessFeePrice, int maxDeliveredGamesPerTable) {
        if (cafeName == null || cafeName.isBlank())
            throw new IllegalArgumentException("Cafe name is required.");
        if (accessFeePrice == null || accessFeePrice.signum() < 0)
            throw new IllegalArgumentException("Access fee must be zero or positive.");
        if (maxDeliveredGamesPerTable <= 0)
            throw new IllegalArgumentException("The delivered game limit must be positive.");
        this.cafeName = cafeName.strip();
        this.accessFeePrice = accessFeePrice;
        this.maxDeliveredGamesPerTable = maxDeliveredGamesPerTable;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getCafeName() { return cafeName; }
    public BigDecimal getAccessFeePrice() { return accessFeePrice; }
    public int getMaxDeliveredGamesPerTable() { return maxDeliveredGamesPerTable; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
}
