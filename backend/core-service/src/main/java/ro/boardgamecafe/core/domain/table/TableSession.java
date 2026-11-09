package ro.boardgamecafe.core.domain.table;

import java.time.Instant;
import jakarta.persistence.*;
import ro.boardgamecafe.core.domain.staff.StaffUser;

@Entity
@Table(name = "table_sessions")
public class TableSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "table_id", nullable = false)
    private CafeTable table;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;
    @Column(name = "join_token_digest", nullable = false, unique = true, length = 64)
    private String joinTokenDigest;
    @Column(name = "pin_hash", nullable = false, length = 100)
    private String pinHash;
    @Column(name = "join_token_encrypted", columnDefinition = "TEXT")
    private String joinTokenEncrypted;
    @Column(name = "pin_encrypted", columnDefinition = "TEXT")
    private String pinEncrypted;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opened_by_id")
    private StaffUser openedBy;
    @Column(name = "failed_join_attempts", nullable = false)
    private int failedJoinAttempts;
    @Column(name = "join_locked_until")
    private Instant joinLockedUntil;
    @Column(name = "started_at", nullable = false)
    private Instant startedAt;
    @Column(name = "closed_at")
    private Instant closedAt;

    protected TableSession() {
    }

    public TableSession(CafeTable table, StaffUser openedBy, String joinTokenDigest, String pinHash,
            String joinTokenEncrypted, String pinEncrypted) {
        if (table == null || openedBy == null || joinTokenDigest == null || pinHash == null
                || joinTokenEncrypted == null || pinEncrypted == null)
            throw new IllegalArgumentException("Session credentials, staff user and table are required.");
        this.table = table;
        this.openedBy = openedBy;
        this.joinTokenDigest = joinTokenDigest;
        this.pinHash = pinHash;
        this.joinTokenEncrypted = joinTokenEncrypted;
        this.pinEncrypted = pinEncrypted;
        this.status = SessionStatus.ACTIVE;
        this.startedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public CafeTable getTable() {
        return table;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public String getJoinTokenDigest() {
        return joinTokenDigest;
    }

    public String getPinHash() {
        return pinHash;
    }

    public String getJoinTokenEncrypted() {
        return joinTokenEncrypted;
    }

    public String getPinEncrypted() {
        return pinEncrypted;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public boolean joinLocked(Instant now) {
        return joinLockedUntil != null && now.isBefore(joinLockedUntil);
    }

    public void recordFailedJoin(Instant now) {
        failedJoinAttempts++;
        if (failedJoinAttempts >= 5) {
            joinLockedUntil = now.plusSeconds(15 * 60);
            failedJoinAttempts = 0;
        }
    }

    public void clearJoinFailures() {
        failedJoinAttempts = 0;
        joinLockedUntil = null;
    }
}
