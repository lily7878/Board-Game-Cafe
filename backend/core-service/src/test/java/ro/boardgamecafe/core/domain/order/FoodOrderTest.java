package ro.boardgamecafe.core.domain.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;
import ro.boardgamecafe.core.domain.menu.MenuCategory;
import ro.boardgamecafe.core.domain.menu.MenuItem;
import ro.boardgamecafe.core.domain.staff.StaffRole;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.domain.table.SessionParticipant;
import ro.boardgamecafe.core.exception.ConflictException;

class FoodOrderTest {
    private final StaffUser staff = new StaffUser("Staff", "staff@test.ro", "hash", StaffRole.STAFF);
    private MenuItem coffee;
    private MenuItem cake;
    private FoodOrder order;

    @BeforeEach
    void setUp() {
        MenuCategory drinks = new MenuCategory("Drinks", null);
        coffee = new MenuItem(drinks, "Coffee", null, new BigDecimal("8.50"));
        cake = new MenuItem(drinks, "Cake", null, new BigDecimal("15.00"));
        order = new FoodOrder(Mockito.mock(SessionParticipant.class),
                List.of(new FoodOrder.Line(coffee, 2), new FoodOrder.Line(cake, 1)));
        ReflectionTestUtils.setField(order.getItems().get(0), "id", 10L);
        ReflectionTestUtils.setField(order.getItems().get(1), "id", 11L);
    }

    @Test
    void newOrder_snapshotsNameAndPrice_andComputesTotal() {
        coffee.changePrice(new BigDecimal("99.00"));
        coffee.rename("Renamed");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PLACED);
        assertThat(order.getItems().get(0).getProductNameSnapshot()).isEqualTo("Coffee");
        assertThat(order.getItems().get(0).getUnitPrice()).isEqualByComparingTo("8.50");
        assertThat(order.total()).isEqualByComparingTo("32.00");
    }

    @Test
    void emptyOrder_isRejected() {
        assertThatThrownBy(() -> new FoodOrder(Mockito.mock(SessionParticipant.class), List.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void partialAcceptance_acceptsOrder_andExcludesRejectedLines() {
        order.process(List.of(new FoodOrder.ItemDecision(10L, true, null),
                new FoodOrder.ItemDecision(11L, false, "Sold out")), staff);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.ACCEPTED);
        assertThat(order.getAcceptedAt()).isNotNull();
        assertThat(order.getItems().get(1).getStatus()).isEqualTo(OrderItemStatus.REJECTED);
        assertThat(order.getItems().get(1).getRejectionReason()).isEqualTo("Sold out");
        assertThat(order.total()).isEqualByComparingTo("17.00");
    }

    @Test
    void allLinesRejected_cancelsOrder_withZeroTotal() {
        order.process(List.of(new FoodOrder.ItemDecision(10L, false, null),
                new FoodOrder.ItemDecision(11L, false, null)), staff);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getCancellationReason()).isEqualTo(OrderCancellationReason.ALL_ITEMS_REJECTED);
        assertThat(order.total()).isEqualByComparingTo("0");
    }

    @Test
    void decisionsMustCoverEveryLineExactlyOnce() {
        assertThatThrownBy(() -> order.process(List.of(new FoodOrder.ItemDecision(10L, true, null)), staff))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> order.process(List.of(new FoodOrder.ItemDecision(10L, true, null),
                new FoodOrder.ItemDecision(10L, false, null)), staff))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> order.process(List.of(new FoodOrder.ItemDecision(10L, true, null),
                new FoodOrder.ItemDecision(99L, true, null)), staff))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PLACED);
        assertThat(order.getItems()).allMatch(item -> item.getStatus() == OrderItemStatus.PENDING);
    }

    @Test
    void processedOrder_cannotBeProcessedChangedOrCancelledAgain() {
        acceptAll();

        assertThatThrownBy(this::acceptAll).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> order.replaceLines(List.of(new FoodOrder.Line(coffee, 1))))
                .isInstanceOf(ConflictException.class);
        assertThatThrownBy(order::cancelByCustomer).isInstanceOf(ConflictException.class);
    }

    @Test
    void kitchenFlow_movesOneStepAtATime() {
        assertThatThrownBy(() -> order.advanceTo(OrderStatus.PREPARING, staff)).isInstanceOf(ConflictException.class);
        acceptAll();

        assertThatThrownBy(() -> order.advanceTo(OrderStatus.DELIVERED, staff)).isInstanceOf(ConflictException.class);
        order.advanceTo(OrderStatus.PREPARING, staff);
        order.advanceTo(OrderStatus.READY, staff);
        order.advanceTo(OrderStatus.DELIVERED, staff);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(order.getReadyAt()).isNotNull();
        assertThat(order.getDeliveredAt()).isNotNull();
        assertThatThrownBy(() -> order.advanceTo(OrderStatus.DELIVERED, staff)).isInstanceOf(ConflictException.class);
    }

    @Test
    void placedOrder_canBeChangedOrCancelledByCustomer() {
        order.replaceLines(List.of(new FoodOrder.Line(cake, 3)));
        assertThat(order.getItems()).hasSize(1);
        assertThat(order.total()).isEqualByComparingTo("45.00");

        order.cancelByCustomer();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getCancellationReason()).isEqualTo(OrderCancellationReason.CUSTOMER_CANCELLED);
    }

    @Test
    void unavailableOrInactiveProducts_areNotOrderable() {
        assertThat(coffee.isOrderable()).isTrue();
        coffee.setAvailable(false);
        assertThat(coffee.isOrderable()).isFalse();
        coffee.setAvailable(true);
        coffee.getCategory().setActive(false);
        assertThat(coffee.isOrderable()).isFalse();
    }

    private void acceptAll() {
        order.process(List.of(new FoodOrder.ItemDecision(10L, true, null),
                new FoodOrder.ItemDecision(11L, true, null)), staff);
    }
}
