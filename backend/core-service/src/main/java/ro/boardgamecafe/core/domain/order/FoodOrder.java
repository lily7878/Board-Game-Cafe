package ro.boardgamecafe.core.domain.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import jakarta.persistence.*;
import ro.boardgamecafe.core.domain.menu.MenuItem;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.TableSession;
import ro.boardgamecafe.core.exception.ConflictException;

/**
 * An order placed by one participant. Lines can be changed or the order cancelled only while it is
 * PLACED. Staff then decides every line at once: if at least one line is accepted the order becomes
 * ACCEPTED, otherwise it is CANCELLED (ALL_ITEMS_REJECTED) and contributes nothing to the bill.
 */
@Entity
@Table(name = "food_orders")
public class FoodOrder {
    /** A requested product and quantity, already validated as orderable by the service. */
    public record Line(MenuItem menuItem, int quantity) {}

    /** Staff decision for one existing order line. */
    public record ItemDecision(Long orderItemId, boolean accepted, String rejectionReason) {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private TableSession session;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_id", nullable = false)
    private SessionParticipant participant;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private OrderStatus status;
    @Enumerated(EnumType.STRING)
    @Column(name = "cancellation_reason", length = 24)
    private OrderCancellationReason cancellationReason;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_id")
    private StaffUser processedBy;
    @Column(name = "placed_at", nullable = false)
    private Instant placedAt;
    @Column(name = "accepted_at")
    private Instant acceptedAt;
    @Column(name = "ready_at")
    private Instant readyAt;
    @Column(name = "delivered_at")
    private Instant deliveredAt;
    @Column(name = "cancelled_at")
    private Instant cancelledAt;
    @Version
    private long version;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<OrderItem> items = new ArrayList<>();

    protected FoodOrder() {
    }

    public FoodOrder(SessionParticipant participant, List<Line> lines) {
        if (participant == null) throw new IllegalArgumentException("Participant is required.");
        this.participant = participant;
        this.session = participant.getSession();
        this.status = OrderStatus.PLACED;
        this.placedAt = Instant.now();
        addLines(lines);
    }

    public void replaceLines(List<Line> lines) {
        requireStatus(OrderStatus.PLACED, "Only orders that are not yet processed can be changed.");
        items.clear();
        addLines(lines);
    }

    public void cancelByCustomer() {
        requireStatus(OrderStatus.PLACED, "Only orders that are not yet processed can be cancelled.");
        cancel(OrderCancellationReason.CUSTOMER_CANCELLED);
    }

    /** Applies a decision to every line atomically; a partial set of decisions is rejected. */
    public void process(List<ItemDecision> decisions, StaffUser staff) {
        requireStatus(OrderStatus.PLACED, "This order has already been processed.");
        Map<Long, ItemDecision> byItem = new HashMap<>();
        for (ItemDecision decision : decisions) {
            if (decision.orderItemId() == null || byItem.put(decision.orderItemId(), decision) != null)
                throw new IllegalArgumentException("Each order line must be decided exactly once.");
        }
        if (byItem.size() != items.size()
                || !items.stream().allMatch(item -> byItem.containsKey(item.getId())))
            throw new IllegalArgumentException("A decision is required for every line of the order, and only for those.");
        for (OrderItem item : items) {
            ItemDecision decision = byItem.get(item.getId());
            if (decision.accepted()) item.accept();
            else item.reject(decision.rejectionReason());
        }
        this.processedBy = staff;
        if (items.stream().anyMatch(item -> item.getStatus() == OrderItemStatus.ACCEPTED)) {
            this.status = OrderStatus.ACCEPTED;
            this.acceptedAt = Instant.now();
        } else {
            cancel(OrderCancellationReason.ALL_ITEMS_REJECTED);
        }
    }

    /** Moves the order one step forward in ACCEPTED → PREPARING → READY → DELIVERED. */
    public void advanceTo(OrderStatus target, StaffUser staff) {
        OrderStatus next = status.nextInPreparation();
        if (next == null || next != target)
            throw new ConflictException("An order in status " + status + " cannot move to " + target + ".");
        this.status = target;
        this.processedBy = staff;
        if (target == OrderStatus.READY) this.readyAt = Instant.now();
        if (target == OrderStatus.DELIVERED) this.deliveredAt = Instant.now();
    }

    /** Preliminary value: accepted and pending lines; zero for a cancelled order. */
    public BigDecimal total() {
        if (status == OrderStatus.CANCELLED) return BigDecimal.ZERO;
        return items.stream().map(OrderItem::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void addLines(List<Line> lines) {
        if (lines == null || lines.isEmpty()) throw new IllegalArgumentException("An order needs at least one product.");
        for (Line line : lines) items.add(new OrderItem(this, line.menuItem(), line.quantity()));
    }

    private void cancel(OrderCancellationReason reason) {
        this.status = OrderStatus.CANCELLED;
        this.cancellationReason = reason;
        this.cancelledAt = Instant.now();
    }

    private void requireStatus(OrderStatus expected, String message) {
        if (status != expected) throw new ConflictException(message);
    }

    public Long getId() { return id; }
    public TableSession getSession() { return session; }
    public SessionParticipant getParticipant() { return participant; }
    public OrderStatus getStatus() { return status; }
    public OrderCancellationReason getCancellationReason() { return cancellationReason; }
    public StaffUser getProcessedBy() { return processedBy; }
    public Instant getPlacedAt() { return placedAt; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public Instant getReadyAt() { return readyAt; }
    public Instant getDeliveredAt() { return deliveredAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public List<OrderItem> getItems() { return Collections.unmodifiableList(items); }
}
