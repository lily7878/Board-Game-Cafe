package ro.boardgamecafe.core.domain.billing;

import java.time.Instant;
import jakarta.persistence.*;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.TableSession;

/**
 * Number of physically present people declared for a session. It is independent of the number of
 * connected phones and may include people who already left. Who may change it is decided by the service.
 */
@Entity
@Table(name = "session_fees")
public class SessionFee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private TableSession session;
    @Column(nullable = false)
    private int quantity;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_participant_id")
    private SessionParticipant updatedByParticipant;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_staff_id")
    private StaffUser updatedByStaff;
    @Version
    private long version;

    protected SessionFee() {
    }

    private SessionFee(TableSession session) {
        if (session == null) throw new IllegalArgumentException("Session is required.");
        this.session = session;
    }

    public static SessionFee declaredByParticipant(TableSession session, SessionParticipant participant, int quantity) {
        SessionFee fee = new SessionFee(session);
        fee.setByParticipant(participant, quantity);
        return fee;
    }

    public static SessionFee declaredByStaff(TableSession session, StaffUser staff, int quantity) {
        SessionFee fee = new SessionFee(session);
        fee.setByStaff(staff, quantity);
        return fee;
    }

    public void setByParticipant(SessionParticipant participant, int quantity) {
        if (participant == null) throw new IllegalArgumentException("Participant is required.");
        change(quantity);
        this.updatedByParticipant = participant;
        this.updatedByStaff = null;
    }

    public void setByStaff(StaffUser staff, int quantity) {
        if (staff == null) throw new IllegalArgumentException("Staff user is required.");
        change(quantity);
        this.updatedByStaff = staff;
        this.updatedByParticipant = null;
    }

    private void change(int quantity) {
        if (quantity < 1) throw new IllegalArgumentException("At least one person must be declared.");
        this.quantity = quantity;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public TableSession getSession() { return session; }
    public int getQuantity() { return quantity; }
    public Instant getUpdatedAt() { return updatedAt; }
    public SessionParticipant getUpdatedByParticipant() { return updatedByParticipant; }
    public StaffUser getUpdatedByStaff() { return updatedByStaff; }
}
