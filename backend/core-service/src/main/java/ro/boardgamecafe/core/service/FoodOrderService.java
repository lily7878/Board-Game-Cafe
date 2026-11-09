package ro.boardgamecafe.core.service;

import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.boardgamecafe.core.api.order.dto.OrderRequests;
import ro.boardgamecafe.core.api.order.dto.OrderResponse;
import ro.boardgamecafe.core.domain.menu.MenuItem;
import ro.boardgamecafe.core.domain.order.FoodOrder;
import ro.boardgamecafe.core.domain.order.OrderItem;
import ro.boardgamecafe.core.domain.order.OrderStatus;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.domain.table.SessionStatus;
import ro.boardgamecafe.core.domain.table.TableSession;
import ro.boardgamecafe.core.exception.ConflictException;
import ro.boardgamecafe.core.repository.FoodOrderRepository;
import ro.boardgamecafe.core.repository.MenuItemRepository;
import ro.boardgamecafe.core.repository.StaffUserRepository;
import ro.boardgamecafe.core.repository.TableSessionRepository;

/**
 * Participant orders and their processing by staff. Prices and totals are always computed here,
 * never taken from the client. Lock order is session → order, which keeps placing an order and the
 * future checkout serialized per session.
 */
@Service
@Transactional(readOnly = true)
public class FoodOrderService {
    /** Orders the staff still has to act on. */
    public static final Set<OrderStatus> OPEN_STATUSES =
            EnumSet.of(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY);

    private final FoodOrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final TableSessionRepository sessionRepository;
    private final StaffUserRepository staffRepository;
    private final SessionAccessService accessService;
    private final SessionLocker sessionLocker;

    public FoodOrderService(FoodOrderRepository orderRepository, MenuItemRepository menuItemRepository,
            TableSessionRepository sessionRepository, StaffUserRepository staffRepository,
            SessionAccessService accessService, SessionLocker sessionLocker) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.sessionRepository = sessionRepository;
        this.staffRepository = staffRepository;
        this.accessService = accessService;
        this.sessionLocker = sessionLocker;
    }

    // ---- participant ----

    @Transactional
    public OrderResponse place(String accessToken, OrderRequests.Place request) {
        SessionParticipant participant = accessService.authenticate(accessToken);
        requireActive(lockSession(participant.getSession().getId()), "New orders require an active session.");
        FoodOrder order = orderRepository.save(new FoodOrder(participant, resolveLines(request.items())));
        orderRepository.flush();
        return response(order);
    }

    @Transactional
    public OrderResponse replaceLines(String accessToken, Long orderId, OrderRequests.Place request) {
        SessionParticipant participant = accessService.authenticate(accessToken);
        requireActive(lockSession(participant.getSession().getId()), "Orders can be changed only in an active session.");
        FoodOrder order = lockOwnOrder(participant, orderId);
        order.replaceLines(resolveLines(request.items()));
        orderRepository.flush();
        return response(order);
    }

    /** Allowed also during checkout: cancelling a pending order helps clear the obligations before payment. */
    @Transactional
    public OrderResponse cancelByParticipant(String accessToken, Long orderId) {
        SessionParticipant participant = accessService.authenticate(accessToken);
        FoodOrder order = lockOwnOrder(participant, orderId);
        order.cancelByCustomer();
        return response(order);
    }

    public List<OrderResponse> mine(String accessToken) {
        SessionParticipant participant = accessService.authenticate(accessToken);
        return orderRepository.findByParticipantIdOrderByPlacedAtDesc(participant.getId()).stream()
                .map(FoodOrderService::response).toList();
    }

    // ---- staff ----

    /** Orders in the given statuses, oldest first; without a filter, the ones still in progress. */
    public List<OrderResponse> list(Set<OrderStatus> statuses) {
        Set<OrderStatus> filter = statuses == null || statuses.isEmpty() ? OPEN_STATUSES : statuses;
        return orderRepository.findByStatusInOrderByPlacedAtAsc(filter).stream()
                .map(FoodOrderService::response).toList();
    }

    public List<OrderResponse> forSession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId))
            throw new EntityNotFoundException("Session not found with id: " + sessionId);
        return orderRepository.findBySessionIdOrderByPlacedAtAsc(sessionId).stream()
                .map(FoodOrderService::response).toList();
    }

    public OrderResponse findById(Long id) {
        return response(orderRepository.findDetailedById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + id)));
    }

    /** T7: decides every line in one transaction; any invalid decision rolls the whole set back. */
    @Transactional
    public OrderResponse process(Long id, OrderRequests.Process request, String staffEmail) {
        FoodOrder order = lockOrder(id);
        requireNotClosed(order);
        List<FoodOrder.ItemDecision> decisions = request.decisions().stream()
                .map(d -> new FoodOrder.ItemDecision(d.orderItemId(), d.accepted(), d.rejectionReason()))
                .toList();
        order.process(decisions, staff(staffEmail));
        return response(order);
    }

    @Transactional
    public OrderResponse changeStatus(Long id, OrderStatus target, String staffEmail) {
        FoodOrder order = lockOrder(id);
        requireNotClosed(order);
        order.advanceTo(target, staff(staffEmail));
        return response(order);
    }

    // ---- helpers ----

    /** Merges repeated products, loads them and checks that each one can currently be ordered. */
    private List<FoodOrder.Line> resolveLines(List<OrderRequests.Line> requested) {
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (OrderRequests.Line line : requested)
            quantities.merge(line.menuItemId(), line.quantity(), Integer::sum);
        Map<Long, MenuItem> items = menuItemRepository.findAllByIdWithCategory(quantities.keySet()).stream()
                .collect(Collectors.toMap(MenuItem::getId, Function.identity()));
        return quantities.entrySet().stream().map(entry -> {
            MenuItem item = items.get(entry.getKey());
            if (item == null) throw new EntityNotFoundException("Menu item not found with id: " + entry.getKey());
            if (!item.isOrderable()) throw new ConflictException("Product is not available: " + item.getName());
            if (entry.getValue() > 99) throw new IllegalArgumentException("Quantity per product cannot exceed 99.");
            return new FoodOrder.Line(item, entry.getValue());
        }).toList();
    }

    private FoodOrder lockOwnOrder(SessionParticipant participant, Long orderId) {
        FoodOrder order = lockOrder(orderId);
        if (!order.getParticipant().getId().equals(participant.getId()))
            throw new EntityNotFoundException("Order not found with id: " + orderId);
        return order;
    }

    private FoodOrder lockOrder(Long id) {
        return orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + id));
    }

    private TableSession lockSession(Long id) {
        return sessionLocker.lock(id);
    }

    private static void requireActive(TableSession session, String message) {
        if (session.getStatus() != SessionStatus.ACTIVE) throw new ConflictException(message);
    }

    private static void requireNotClosed(FoodOrder order) {
        if (order.getSession().getStatus() == SessionStatus.CLOSED)
            throw new ConflictException("The session is closed.");
    }

    private StaffUser staff(String email) {
        return staffRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new EntityNotFoundException("Staff user not found."));
    }

    private static OrderResponse response(FoodOrder order) {
        List<OrderResponse.Item> items = order.getItems().stream().map(FoodOrderService::response).toList();
        return new OrderResponse(order.getId(), order.getSession().getId(),
                order.getSession().getTable().getTableNumber(), order.getParticipant().getId(),
                order.getParticipant().getDisplayName(), order.getStatus(), order.getCancellationReason(),
                order.total(), order.getPlacedAt(), order.getAcceptedAt(), order.getReadyAt(),
                order.getDeliveredAt(), order.getCancelledAt(), items);
    }

    private static OrderResponse.Item response(OrderItem item) {
        return new OrderResponse.Item(item.getId(), item.getMenuItem().getId(), item.getProductNameSnapshot(),
                item.getQuantity(), item.getUnitPrice(), item.lineTotal(), item.getStatus(),
                item.getRejectionReason());
    }
}
