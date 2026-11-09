package ro.boardgamecafe.core.domain.game;

import java.time.Instant;
import jakarta.persistence.*;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.TableSession;
import ro.boardgamecafe.core.exception.GameRequestConflictException;
import ro.boardgamecafe.core.domain.staff.StaffUser;

@Entity
@Table(name = "game_requests")
public class GameRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private TableSession session;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_id", nullable = false)
    private SessionParticipant participant;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_copy_id")
    private GameCopy gameCopy;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private GameRequestStatus status;
    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;
    @Column(name = "reserved_at") private Instant reservedAt;
    @Column(name = "delivered_at") private Instant deliveredAt;
    @Column(name = "returned_at") private Instant returnedAt;
    @Column(name = "cancelled_at") private Instant cancelledAt;
    @Column(name = "resolution_reason", columnDefinition = "TEXT") private String resolutionReason;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "processed_by_id")
    private StaffUser processedBy;
    @Version @Column(nullable = false) private Long version;

    protected GameRequest() {}
    public GameRequest(SessionParticipant participant, Game game) {
        if (participant == null || game == null) throw new IllegalArgumentException("Participant and game are required.");
        this.participant = participant; this.session = participant.getSession(); this.game = game;
        this.status = GameRequestStatus.REQUESTED; this.requestedAt = Instant.now();
    }
    public void reserve(GameCopy copy) {
        requireStatus(GameRequestStatus.REQUESTED);
        if (copy == null || !copy.getGame().getId().equals(game.getId()) || copy.getConditionStatus() != CopyCondition.USABLE)
            throw new GameRequestConflictException("The selected copy is not usable for this game.");
        this.gameCopy = copy; this.status = GameRequestStatus.RESERVED; this.reservedAt = Instant.now();
    }
    public void deliver() { requireStatus(GameRequestStatus.RESERVED); status = GameRequestStatus.DELIVERED; deliveredAt = Instant.now(); }
    public void returnCopy() { requireStatus(GameRequestStatus.DELIVERED); status = GameRequestStatus.RETURNED; returnedAt = Instant.now(); }
    public void reject(String reason) { requireStatus(GameRequestStatus.REQUESTED); status = GameRequestStatus.REJECTED; resolutionReason = reason; }
    public void cancel(String reason) {
        if (status != GameRequestStatus.REQUESTED && status != GameRequestStatus.RESERVED)
            throw new GameRequestConflictException("Only requested or reserved games can be cancelled.");
        status = GameRequestStatus.CANCELLED; cancelledAt = Instant.now(); resolutionReason = reason;
    }
    private void requireStatus(GameRequestStatus expected) {
        if (status != expected) throw new GameRequestConflictException("Expected " + expected + " but request is " + status + ".");
    }
    public Long getId() { return id; }
    public TableSession getSession() { return session; }
    public SessionParticipant getParticipant() { return participant; }
    public Game getGame() { return game; }
    public GameCopy getGameCopy() { return gameCopy; }
    public GameRequestStatus getStatus() { return status; }
    public Instant getRequestedAt() { return requestedAt; }
    public Instant getReservedAt() { return reservedAt; }
    public Instant getDeliveredAt() { return deliveredAt; }
    public Instant getReturnedAt() { return returnedAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public String getResolutionReason() { return resolutionReason; }
    public StaffUser getProcessedBy() { return processedBy; }
    public void recordProcessor(StaffUser staff) { processedBy = staff; }
}
