package ro.boardgamecafe.core.domain.settings;

import java.time.LocalTime;
import jakarta.persistence.*;

/**
 * Informative schedule for one weekday (1 = Monday ... 7 = Sunday). It never restricts opening
 * sessions and is unrelated to simulated business days. Overnight intervals are out of scope.
 */
@Entity
@Table(name = "opening_hours")
public class OpeningHours {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "day_of_week", nullable = false, unique = true)
    private int dayOfWeek;
    @Column(name = "open_time")
    private LocalTime openTime;
    @Column(name = "close_time")
    private LocalTime closeTime;
    @Column(nullable = false)
    private boolean closed;

    protected OpeningHours() {
    }

    public void markClosed() {
        this.closed = true;
        this.openTime = null;
        this.closeTime = null;
    }

    public void open(LocalTime openTime, LocalTime closeTime) {
        if (openTime == null || closeTime == null)
            throw new IllegalArgumentException("Opening and closing times are required for an open day.");
        if (!openTime.isBefore(closeTime))
            throw new IllegalArgumentException("Opening time must be before closing time.");
        this.closed = false;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }

    public Long getId() { return id; }
    public int getDayOfWeek() { return dayOfWeek; }
    public LocalTime getOpenTime() { return openTime; }
    public LocalTime getCloseTime() { return closeTime; }
    public boolean isClosed() { return closed; }
}
