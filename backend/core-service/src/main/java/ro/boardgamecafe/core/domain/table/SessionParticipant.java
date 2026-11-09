package ro.boardgamecafe.core.domain.table;

import java.time.Instant;
import jakarta.persistence.*;

@Entity
@Table(name = "session_participants")
public class SessionParticipant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private TableSession session;
    @Column(name = "display_name", nullable = false, length = 80)
    private String displayName;
    @Column(name = "access_token_hash", nullable = false, unique = true, length = 64)
    private String accessTokenHash;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;
    @Column(name = "left_at")
    private Instant leftAt;

    protected SessionParticipant() {}
    public SessionParticipant(TableSession session, String displayName, String accessTokenHash) {
        if (session == null || displayName == null || displayName.isBlank() || displayName.length() > 80 || accessTokenHash == null) throw new IllegalArgumentException("Invalid participant details.");
        this.session = session; this.displayName = displayName.strip(); this.accessTokenHash = accessTokenHash;
        this.active = true; this.joinedAt = Instant.now();
    }
    public Long getId() { return id; }
    public TableSession getSession() { return session; }
    public String getDisplayName() { return displayName; }
    public boolean isActive() { return active; }
    public Instant getJoinedAt() { return joinedAt; }
    public void leave() { active = false; leftAt = Instant.now(); }
}
