package ro.boardgamecafe.core.domain.day;

import java.time.Instant;
import jakarta.persistence.*;
import ro.boardgamecafe.core.domain.staff.StaffUser;

/**
 * A simulated business day, independent of the calendar date. Day 1 is created by migration V5;
 * every following day is opened by End of Day in the same transaction that finalizes the previous one.
 */
@Entity
@Table(name = "business_days")
public class BusinessDay {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "day_number", nullable = false, unique = true)
    private int dayNumber;
    @Column(nullable = false, length = 50)
    private String label;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private BusinessDayStatus status;
    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;
    @Column(name = "finalized_at")
    private Instant finalizedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finalized_by_id")
    private StaffUser finalizedBy;
    @Version
    private long version;

    protected BusinessDay() {
    }

    public Long getId() { return id; }
    public int getDayNumber() { return dayNumber; }
    public String getLabel() { return label; }
    public BusinessDayStatus getStatus() { return status; }
    public Instant getOpenedAt() { return openedAt; }
    public Instant getFinalizedAt() { return finalizedAt; }
    public StaffUser getFinalizedBy() { return finalizedBy; }
    public boolean isOpen() { return status == BusinessDayStatus.OPEN; }
}
